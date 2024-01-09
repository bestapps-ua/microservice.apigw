
class ApiUserCredential {

    private _uid: string;
    private _type: string;
    private _credential: string;

    constructor(data) {
        //console.log('[cdata]', data);
        this._uid = data.user._data.uid;
        this._type = data.type;
        this._credential = data.credential;
    }

    get credential(): string {
        return this._credential;
    }

    set credential(value: string) {
        this._credential = value;
    }
    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }
    get uid(): string {
        return this._uid;
    }

    set uid(value: string) {
        this._uid = value;
    }
}

export default ApiUserCredential;
