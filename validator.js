function Validator(formSelector) {
    var _this = this;

    function getParent(element, selector) {

        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }

    }

    var formRules = {};

    /**
     * Quy ước tạo rule:
     * - Nếu có lỗi thì return `error message`
     * - Nếu không có lỗi thì return `undefined`
     */
    var validateRules = {
        required: function(value) {
            return value ? undefined : 'Vui lòng nhập trường hợp này!'
        },
        email: function(value) {
            var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            return regex.test(value) ? undefined : 'Vui lòng nhập lại email.'
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} kí tự!`
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối thiểu ${max} kí tự!`
            }
        }
    }

    // Lấy re form element trong DOM theo `formSelector`
    var formElement = document.querySelector(formSelector);

    // Chỉ xử lý khi có element trong DOM
    if (formElement) {

        var inputs = formElement.querySelectorAll('[name][rules]');

        for (var input of inputs) {
            
            var rules = input.getAttribute('rules').split('|');
            for (var rule of rules) {

                var ruleInfo;
                var isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');

                    rule = ruleInfo[0];
                }

                var ruleFunc = validateRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validator (blur, change, ...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];

            var errorMessage;

            for (var rule of rules) {
                errorMessage = rule(event.target.value)
                if (errorMessage) break;
            }
            
            rules.find(function (rule) {
                errorMessage = rule(event.target.value)
                return errorMessage;
            })
            
            // Nếu có lỗi thì hiển thị messagemessage ra UI
            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group') 
                if (formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group') 
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid'); 

                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
    }

    // Hàm xử lí hành vi submit form
    formElement.onsubmit = function(event) {
        event.preventDefault();

        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }

        if (isValid) {
            if (typeof _this.onSubmit === 'function') {
                let enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    
                    let formValuesArray = Array.from(enableInputs).reduce( (values, input) => {
                       
                        switch(input.type) {
                            // nếu type = 'checkbox'
                            case 'checkbox':
                               
                                if (!Array.isArray(values[input.name])) 
                                {
                                    values[input.name] = [];
                                }
                                if (input.matches(':checked'))
                                {
                                    values[input.name].push(input.value);
                                }
                                break;

                            case 'radio':
                               
                            if (input.matches(':checked'))
                            {
                                values[input.name] = input.value
                            } 
                            break;

                            case 'file':
                                values[input.name] = input.files;
                                break;

                            default:
                                values[input.name] = input.value
                        }

                        return values;
                    },{});

                _this.onSubmit(formValuesArray);
            } else {
                formElement.submit();
            }
        }
    }
}