const { MoleculerError } = require("moleculer").Errors;

class UserRegisterPinError extends MoleculerError {
    constructor(id: any) {
        super(id, 500, "USER_REGISTER_PIN_ERROR", id);
    }
};

export default UserRegisterPinError;
