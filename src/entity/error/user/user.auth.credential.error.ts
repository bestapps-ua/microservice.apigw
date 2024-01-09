const { MoleculerError } = require("moleculer").Errors;

class UserAuthCredentialError extends MoleculerError {
    constructor(id: any) {
        super(id, 500, "USER_AUTH_CREDENTIAL_ERROR", id);
    }
};

export default UserAuthCredentialError;
