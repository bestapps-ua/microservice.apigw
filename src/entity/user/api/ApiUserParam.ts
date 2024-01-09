
class ApiUserParam {
    private _key: string;
    private _value: any;
    private _uid: string;

    constructor(data) {
        this._uid = data.user.uid;
        this._key = data.key;
        this._value = data.value;
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }
    get key(): string {
        return this._key;
    }

    set key(value: string) {
        this._key = value;
    }

    get uid(): string {
        return this._uid;
    }

    set uid(value: string) {
        this._uid = value;
    }
}

export default ApiUserParam;
