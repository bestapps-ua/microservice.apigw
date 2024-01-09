const { MoleculerError } = require("moleculer").Errors;

class LengthError extends MoleculerError {
    constructor(err) {
        super(err, 403, "LENGTH_ERROR", err);
    }
}

export default LengthError;
