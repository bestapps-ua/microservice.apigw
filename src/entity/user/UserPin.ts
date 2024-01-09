import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import User from "./User";

class UserPin extends Entity {

    private _pin: string;
    private _token: string;
    private _user: User;
    private _status: string;
    private _type: string;
    private _credential: string;

    constructor(data) {
        super(data);
        this._user = data.user;
        this._status = data.status;
        this._type = data.type;
        this._credential = data.credential;
        this._pin = data.pin;
        this._token = data.token;
    }

    get token(): string {
        return this._token;
    }

    set token(value: string) {
        this._token = value;
    }
    get pin(): string {
        return this._pin;
    }

    set pin(value: string) {
        this._pin = value;
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
    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }
    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }

    get credential(): string {
        return this._credential;
    }

}

export default UserPin;
