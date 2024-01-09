
class ApiUserSession {


    private _userId: string;
    private _sid: string;

    constructor(data) {
        this._userId = data.userId;
        this._sid = data.sid;
    }

    get userId() {
        return this._userId;
    }

    set userId(value) {
        this._userId = value;
    }

    get sid(): string {
        return this._sid;
    }

    set sid(value: string) {
        this._sid = value;
    }
}

export default ApiUserSession;
