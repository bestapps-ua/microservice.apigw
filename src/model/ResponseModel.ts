import User from "../entity/user/User";
import UserSession from "../entity/user/UserSession";
import AuthCode from "../entity/auth/AuthCode";
import secureModel from "./SecureModel";
let uuid4 = require('uuid/v4');

class ResponseModel {

    private getSuccess() {
        let data = {
            ok: true,
            uid: uuid4(),
            data: {},
        };
        return JSON.parse(JSON.stringify(data));
    }

    async getAuthCodeResponse(session: UserSession) {
        let data = this.getSuccess();
        data.data = {
            sid: session.sid,
        }
        return data;
    }

    async getSendAuthCodeResponse() {
        return this.getSuccess();
    }

    async getSessionTouchSecureResponse(authCode: AuthCode, secure: boolean) {
        let data = this.getSuccess();
        return await this.getSecureResponse(authCode, secure, data);
    }

    async getMyProfileSecuredResponse(authCode: AuthCode, secure: boolean, user: User) {
        let data = this.getSuccess();
        data.data = {
            uid: user.uid,
        }
        return await this.getSecureResponse(authCode, secure, data);
    }

    private async getSecureResponse(authCode: AuthCode, secure: boolean, data: any) {
        if (!secure) {
            return data;
        }
        return {
            secureData: await secureModel.encrypt(authCode, data)
        }
    }
}

export default new ResponseModel();
