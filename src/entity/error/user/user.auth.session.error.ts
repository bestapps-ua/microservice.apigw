const { MoleculerError } = require("moleculer").Errors;

class UserAuthSessionError extends MoleculerError {
    constructor(id: any) {
        super(id, 401, "USER_AUTH_SESSION_ERROR", id);
    }
};

export default UserAuthSessionError;
