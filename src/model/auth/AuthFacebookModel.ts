'use strict';
import appModel from "../AppModel";
import apiUserCredentialModel from "../user/api/ApiUserCredentialModel";
import {CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_FACEBOOK, CREDENTIAL_TYPE_USERNAME} from "../user/UserCredentialType";
import UserAuthCredentialError from "../../entity/error/user/user.auth.credential.error";
import userSessionModel from "../user/UserSessionModel";
import userModel from "../user/UserModel";
import UserSession from "../../entity/user/UserSession";
import InternalError from "../../entity/error/internal.error";
import UserRegisterError from "../../entity/error/user/user.register.error";
import apiUserModel from "../user/api/ApiUserModel";
import User from "../../entity/user/User";

import { v4 as uuidv4 } from 'uuid';
import AuthError from "../../entity/auth/AuthError";


class AuthFacebookModel {

    async getAuthUrl(scopes, mode, accessType = 'offline', responseType = 'code') {
        let res;
        try {
            res = await appModel.broker.call("facebook.oauth2.getAuthUrl", {
                scopes,
                mode,
                accessType,
                responseType
            });
        } catch (err) {
            res = new AuthError(err);
        }
        return res;
    }

    async getTokenByCode(code, mode) {
        let res;
        try {
            res = await appModel.broker.call("facebook.oauth2.getTokenByCode", {
                mode,
                code,
            });
        } catch (err) {
            res = new AuthError(err);
        }
        return res;
    }


    async login(accessToken) {
        let userData: any = await facebookGraphProfileModel.getMyProfile(accessToken, {
            fields: 'id, name, email'
        });
        console.log('[userData]', userData);
        if (!userData || userData instanceof AuthError) {
            return {
                ok: false,
                type: 'error',
                error: new AuthError('Access restricted')
            };
        }
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_FACEBOOK, userData.user.id);
        if (apiUserCredential) {
            return await this.makeSession(apiUserCredential);
        }

        if (userData.user.email) {
            apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, userData.user.email);
            if (apiUserCredential) {
                return {
                    ok: false,
                    type: 'login',
                    data: {
                        email: userData.user.email,
                    }
                }
                //return await this.makeSession(apiUserCredential);
            }
        }
        return {
            ok: false,
            type: 'register',
            facebookUser: userData.user,
        }
    }

    async makeSession(apiUserCredential) {
        let user = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                if (!user) return rej(err);
                res(user);
            });
        });
        if (!user) return {
            ok: false,
            error: new UserAuthCredentialError('Internal error')
        };

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

    async merge(apiUserCredential, userData) {
        let user = await new Promise((res, rej) => {
            userModel.getByUid(apiUserCredential.uid, (err, user) => {
                if (!user) return rej(err);
                res(user);
            });
        });
        if (!user) return {
            ok: false,
            type: 'error',
            error: new UserAuthCredentialError('Internal error')
        };
        await apiUserCredentialModel.add(apiUserCredential.uid, CREDENTIAL_TYPE_FACEBOOK, userData.id);
        return await this.makeSession(apiUserCredential);
    }

    async register(data) {
        let facebookUser = data.facebookUser;
        let username = await userModel.generateUsername(facebookUser.name, 0);
        let credentials = [
            {
                type: CREDENTIAL_TYPE_FACEBOOK,
                credential: facebookUser.id
            },
            {
                type: CREDENTIAL_TYPE_USERNAME,
                credential: username
            }
        ];
        if (facebookUser.email) {
            credentials.push({
                type: CREDENTIAL_TYPE_EMAIL,
                credential: facebookUser.email
            });
        } else {

        }

        let apiUser = await apiUserModel.create([], credentials);
        if (!apiUser) return {
            ok: false,
            error: new UserRegisterError('cannot create api user')
        }
        await apiUserModel.setPassword(apiUser.uid, uuidv4());

        let userData = new User({
            uid: apiUser.uid,
        });

        let user = await new Promise((res, rej) => {
            userModel.create(userData, (err, user) => {
                if (!user) return rej(err);
                res(user);
            });
        });

        if (!user) return {
            ok: false,
            error: new UserRegisterError('cannot create user')
        };

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

    async addCredential(uid: string, id){
        await apiUserCredentialModel.add(uid, CREDENTIAL_TYPE_FACEBOOK, id);
    }
}

export default new AuthFacebookModel();
