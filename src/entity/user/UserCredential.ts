import Entity from "@bestapps/microservice-entity/dist/entity/Entity";

class UserCredential extends Entity {
    private _type: any;
    private _credential: any;

    constructor(data) {
        super(data);
        this._type = data.type;
        this._credential = data.credential;
    }

    get credential(){
        return this._credential;
    }

    set credential(value) {
        this._credential = value;
    }
    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }
}

export default UserCredential;
