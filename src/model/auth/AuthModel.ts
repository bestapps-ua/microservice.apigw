'use strict';

import apiUserModel from "../user/api/ApiUserModel";
import User from "../../entity/user/User";
import userModel from "../user/UserModel";
import {
    CREDENTIAL_TYPE_DEVICE,
    CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_KEY,
    CREDENTIAL_TYPE_PHONE,
    CREDENTIAL_TYPE_USERNAME
} from "../user/UserCredentialType";
import apiUserCredentialModel from "../user/api/ApiUserCredentialModel";
import UserAuthCredentialError from "../../entity/error/user/user.auth.credential.error";
import userSessionModel from "../user/UserSessionModel";
import UserSession from "../../entity/user/UserSession";
import UserRegisterError from "../../entity/error/user/user.register.error";
import InternalError from "../../entity/error/internal.error";
import { v4 as uuidv4 } from 'uuid';

class AuthModel {

    private async create(params, credentials, password) {
        let apiUser = await apiUserModel.create(params, credentials);
        if (!apiUser) return {
            ok: false,
            error: new UserRegisterError('cannot create api user')
        }
        await apiUserModel.setPassword(apiUser.uid, password);

        let userData = new User({
            uid: apiUser.uid,
        });

        let user = await new Promise((res, rej) => {
            userModel.create(userData, (err, user) => {
                if (!user) return rej(err);
                res(user);
            });
        });
        return user;
    }

    async register(data) {
        let isFake = data.isFake || false;
        let params = [
            {
                key: 'pushEnabled',
                value: data.sendNotifications ? 1 : 0
            }
        ];
        let credentials = [{
            type: CREDENTIAL_TYPE_USERNAME,
            credential: data.username
        }];

        if (isFake) {
            params.push({
                key: 'isFake',
                value: 1
            });
        } else {
            credentials.push(
                {
                    type: CREDENTIAL_TYPE_EMAIL,
                    credential: data.email
                }
            );
        }

        let user = await this.create(params, credentials, data.password);

        if (!user) return {
            ok: false,
            error: new UserRegisterError('cannot create user')
        };


        return await this.createSession(user);
    }

    async isRegistered(email: string): Promise<boolean> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, email);
        return !(apiUserCredential === undefined);
    }


    async isRegisteredPhone(phone: string): Promise<boolean> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_PHONE, phone);
        return !(apiUserCredential === undefined);
    }

    async isRegisteredUsername(username: string): Promise<boolean> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_USERNAME, username);
        return !(apiUserCredential === undefined);
    }

    async login(data) {
        let user = await this.getUserByEmail(data.email);
        if (!user) {
            return {
                ok: false,
                error: new UserAuthCredentialError('user or password does not match')
            }
        }

        if (user.apiUser.password !== await this.encryptPassword(data.password)) return {
            ok: false,
            error: new UserAuthCredentialError('user or password does not match')
        };

        return await this.createSession(user);
    }

    private async createSession(user){
        let userSession;
        try {
            userSession = await userSessionModel.create(new UserSession({
                user,
            }));
        } catch (err) {
            console.log('[err]', err);
        }

        if (!userSession) return {
            ok: false,
            error: new UserRegisterError('session error')
        };

        return {
            ok: true,
            user,
            sid: userSession.sid,
        }
    }

    async forgotPassword(data) {
        let user = await this.getUserByEmail(data.email);
        if (!user) {
            return {
                ok: false,
                error: new UserAuthCredentialError('user or password does not match')
            }
        }

        await apiUserModel.setPassword(user.uid, data.password);

        let userSession = await userSessionModel.create(new UserSession({
            user,
        }));

        if (!userSession) return {
            ok: false,
            error: new InternalError('session')
        };

        return {
            ok: true,
            user,
            sid: userSession.sid,
        }
    }

    /**
     * TODO:!!!
     * @param password
     */
    async encryptPassword(password) {
        return await apiUserModel.encryptPassword(password);
    }

    async getUserByEmail(email): Promise<User> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, email);
        if (!apiUserCredential) return;
        let user: User = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                res(user);
            });
        });
        return user;
    }

    async getUserByDevice(deviceId, platform): Promise<User> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_DEVICE, `${platform}::${deviceId}`);
        if (!apiUserCredential) return;
        let user: User = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                res(user);
            });
        });
        return user;
    }


    async loginDevice(data) {
        let user = await this.getUserByDevice(data.deviceId, data.platform);
        if (user) {
            return await this.createSession(user);
        }

        let credentials = [
            {
                type: CREDENTIAL_TYPE_DEVICE,
                credential: `${data.platform}::${data.deviceId}`
            },
        ];

        let apiUser = await apiUserModel.create([], credentials);
        if (!apiUser) return {
            ok: false,
            error: new UserRegisterError('cannot create api user')
        }
        await apiUserModel.setPassword(apiUser.uid, uuidv4());

        let userData = new User({
            uid: apiUser.uid,
        });

        user = await new Promise((res, rej) => {
            userModel.create(userData, (err, user) => {
                if (!user) return rej(err);
                res(user);
            });
        });

        if (!user) return {
            ok: false,
            error: new UserRegisterError('cannot create user')
        };

        return await this.createSession(user);
    }

    async loginPhone(data) {
        let user = await this.getUserByPhone(data.phone);
        if (!user) {
            return {
                ok: false,
                error: new UserAuthCredentialError('user or password does not match')
            }
        }

        if (user.apiUser.password !== await this.encryptPassword(data.password)) return {
            ok: false,
            error: new UserAuthCredentialError('user or password does not match')
        };

        return await this.createSession(user);
    }

    async getUserByPhone(phone: string): Promise<User> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_PHONE, phone);
        if (!apiUserCredential) return;
        let user: User = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                res(user);
            });
        });
        return user;
    }

    async getUserByKey(key: string): Promise<User> {
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_KEY, key);
        if (!apiUserCredential) return;
        let user: User = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                res(user);
            });
        });
        return user;
    }

    async loginKey(data) {
        let user = await this.getUserByKey(data.key);
        if (!user) {
            return {
                ok: false,
                error: new UserAuthCredentialError('user or password does not match')
            }
        }

        if (user.apiUser.password !== await this.encryptPassword(data.password)) return {
            ok: false,
            error: new UserAuthCredentialError('user or password does not match')
        };

        return {
            ok: true,
            user,
        };
    }
}

export default new AuthModel();
