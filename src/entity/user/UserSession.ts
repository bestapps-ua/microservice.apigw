import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import User from "./User";

class UserSession extends Entity {

    private _sid: string;
    private _user: User;

    constructor(data) {
        super(data);
        this._id = data.sid;
        this._sid = data.sid;
        this._user = data.user;
    }

    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }
    get sid(): string {
        return this._sid;
    }

    set sid(value: string) {
        this._sid = value;
    }

    get uid() {
        return this.sid;
    }
}

export default UserSession;
