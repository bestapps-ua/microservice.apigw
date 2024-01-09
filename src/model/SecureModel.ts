import AuthCode from "../entity/auth/AuthCode";
let CryptoJS = require("crypto-js");

class SecureModel {
    async generateSecret(authCode: AuthCode) {
        let user = await authCode.user;
        let key = user.getKey();
        console.log('KEY', `${key}::${authCode.uid}`);
        return `${key}::${authCode.uid}`;
    }

    async encrypt(authCode: AuthCode, data: any) {
        let secret = await this.generateSecret(authCode);
        return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
    }

    async decrypt(authCode: AuthCode, token: string) {
        let secret = await this.generateSecret(authCode);
        return JSON.parse(CryptoJS.AES.decrypt(token, secret).toString(CryptoJS.enc.Utf8));
    }
}

export default new SecureModel();
