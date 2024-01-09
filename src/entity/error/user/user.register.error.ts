const { MoleculerError } = require("moleculer").Errors;

class UserRegisterError extends MoleculerError {
    constructor(id: any) {
        super(id, 500, "USER_REGISTER_ERROR", id);
    }
};

export default UserRegisterError;
