import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import ApiUser from "./api/ApiUser";
import ApiUserCredential from "./api/ApiUserCredential";

class User extends Entity {


    private _credentials: Array<ApiUserCredential>;
    private _params: Map<any, any>;
    private _apiUser: ApiUser;

    public ignoredProperties = [
        'apiUser',
        'credentials',
        'params',
    ];

    constructor(props) {
        super(props);
        this._apiUser = this.props.apiUser;
        this._credentials = this.props.credentials;
        this._params = this.props.params;
    }

    get params(): Map<any, any> {
        return this._params;
    }

    set params(value: Map<any, any>) {
        this._params = value;
    }

    get credentials(): Array<ApiUserCredential> {
        return this._credentials;
    }

    set credentials(value: Array<ApiUserCredential>) {
        this._credentials = value;
    }

    isPhoneExists(phone: string) {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].credential === phone) return true;
        }
        return false;
    }

    get apiUser(): ApiUser {
        return this._apiUser;
    }

    set apiUser(value: ApiUser) {
        this._apiUser = value;
    }

    getPhone() {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].type === 'phone') return this.credentials[i].credential;
        }
        return;
    }

    getEmail() {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].type === 'email') return this.credentials[i].credential;
        }
        return;
    }

    getUsername() {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].type === 'username') return this.credentials[i].credential;
        }
        return;
    }

    getKey() {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].type === 'key') return this.credentials[i].credential;
        }
        return;
    }

    getTelegramId() {
        for (let i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].type === 'telegram.id') return this.credentials[i].credential;
        }
        return;
    }
}

export default User;
