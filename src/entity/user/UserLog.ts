import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import User from "./User";
import UserSession from "./UserSession";

class UserLog extends Entity {

    private _user: User;
    private _action: string;
    private _request: any;
    private _response: any;
    private _session: UserSession;

    constructor(props) {
        super(props);
        this._user = this.props.user;
        this._session = this.props.session;
        this._action = this.props.action;
        this._request = this.props.request;
        this._response = this.props.response;
    }

    get response(): any {
        return this._response;
    }

    set response(value: any) {
        this._response = value;
    }
    get request(): any {
        return this._request;
    }

    set request(value: any) {
        this._request = value;
    }
    get action(): string {
        return this._action;
    }

    set action(value: string) {
        this._action = value;
    }
    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }

    get session(): UserSession {
        return this._session;
    }

    set session(value: UserSession) {
        this._session = value;
    }
}


export default UserLog;
