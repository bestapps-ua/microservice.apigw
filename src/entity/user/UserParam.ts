import Entity from "@bestapps/microservice-entity/dist/entity/Entity";

class UserParam extends Entity {
    private _key: any;
    private _value: any;

    constructor(data) {
        super(data);
        this._key = data.key;
        this._value = data.value;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }
    get key() {
        return this._key;
    }

    set key(value) {
        this._key = value;
    }
}

export default UserParam;
