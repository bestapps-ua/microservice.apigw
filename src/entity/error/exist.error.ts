const { MoleculerError } = require("moleculer").Errors;

class ExistError extends MoleculerError {
    constructor(message) {
        super(message, 500, "EXIST_ERROR");
    }
}
export default ExistError;
