import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import User from "../user/User";

class AuthCode extends Entity {


    private _user: User;
    private _sessionId: string;
    private _status: string;
    private _expires: number;


    constructor(props) {
        super(props);
        this._user = props.user;
        this._sessionId = props.sessionId;
        this._status = props.status;
        this._expires = props.expires;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }
    get sessionId(): string {
        return this._sessionId;
    }

    set sessionId(value: string) {
        this._sessionId = value;
    }

    get user(): User {
        return this._get('_user');
    }

    set user(value: User) {
        this._user = value;
    }

    get expires(): number {
        return this._expires;
    }

    set expires(value: number) {
        this._expires = value;
    }
}

export default AuthCode;
