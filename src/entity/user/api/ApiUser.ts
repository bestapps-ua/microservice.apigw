class ApiUser {

    private _userId: string;
    private _uid: string;
    private _isNew: boolean;
    private _password: string;

    constructor(data) {
        this._userId = data.uid;
        this._uid = data.uid;
        this._password = data.password;
        this._isNew = data.isNew;
    }

    get isNew() {
        return this._isNew;
    }

    set isNew(value) {
        this._isNew = value || false;
    }

    get uid() {
        return this._uid;
    }

    set uid(value) {
        this._uid = value;
    }

    get userId() {
        return this._userId;
    }

    set userId(value) {
        this._userId = value;
    }

    get password(): string {
        return this._password;
    }

    set password(value: string) {
        this._password = value;
    }

}

export default ApiUser;
