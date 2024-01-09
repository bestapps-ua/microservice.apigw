const { MoleculerError } = require("moleculer").Errors;

class EmptyError extends MoleculerError {
    constructor(err) {
        super(`Empty ${err}`, 404, "EMPTY_ERROR", err);
    }
}

export default EmptyError;
