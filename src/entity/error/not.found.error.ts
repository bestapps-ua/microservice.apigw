const { MoleculerError } = require("moleculer").Errors;

class NotFoundError extends MoleculerError {
    constructor(err) {
        super(`Not found error`, 404, "NOT_FOUND_ERROR", err);
    }
}

export default NotFoundError;
