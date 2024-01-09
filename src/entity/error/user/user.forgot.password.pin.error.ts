const { MoleculerError } = require("moleculer").Errors;

class UserForgotPasswordPinError extends MoleculerError {
    constructor(id: any) {
        super(id, 500, "USER_FORGOT_PASSWORD_PIN_ERROR", id);
    }
};

export default UserForgotPasswordPinError;
