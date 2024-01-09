const { MoleculerError } = require("moleculer").Errors;

class InternalError extends MoleculerError {
    constructor(data) {
        super(`Internal error`, 500, "INTERNAL_ERROR", data);
    }
}

export default InternalError;
