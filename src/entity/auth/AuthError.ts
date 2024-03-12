class AuthError
{

    private _error: any;

    constructor(error) {
        this._error = error;
    }

    get error(): any {
        return this._error;
    }

    set error(value: any) {
        this._error = value;
    }
}

export default AuthError;
