'use strict';
import appModel from '../app_model';
import AuthError from "../../entity/api/auth/auth_error";
import apiUserCredentialModel from "../user/api/api_user_credential_model";
import {
    CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_GOOGLE,
    CREDENTIAL_TYPE_TWITTER,
    CREDENTIAL_TYPE_USERNAME
} from "../user/user_credential_type";
import UserAuthCredentialError from "../../entity/error/user/user.auth.credential.error";
import userModel from "../user/user_model";
import userSessionModel from "../user/user_session_model";
import UserSession from "../../entity/app/user/user-session";
import InternalError from "../../entity/error/internal.error";
import apiUserModel from "../user/api/api_user_model";
import UserRegisterError from "../../entity/error/user/user.register.error";
import User from "../../entity/app/user/user";
let uuid4 = require('uuid/v4');


class AuthTwitterModel {

    async getAuthUrl(scopes, mode, redirectUrl = null, accessType = 'offline', responseType = 'code') {
        let res;
        try {
            res = await appModel.broker.call("twitter.oauth2.getAuthUrl", {
                scopes,
                redirectUrl,
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
            res = await appModel.broker.call("twitter.oauth2.getTokenByCode", {
                mode,
                code,
            });
        } catch (err) {
            res = new AuthError(err);
        }
        return res;
    }

    async getUserInfo(accessToken, mode) {
        let res;
        try {
            res = await appModel.broker.call("twitter.oauth2.getUserInfo", {
                accessToken,
                mode,
            });
        } catch (err) {
            res = new AuthError(err);
        }
        return res;
    }

    /*
    [userData] { user:
       { id: '115980522578926623880',
         email: 'vitaliy.grinchishin@gmail.com',
         verified_email: true,
         name: 'Виталий Гринчишин',
         given_name: 'Виталий',
         family_name: 'Гринчишин',
         picture:
          'https://lh4.googleusercontent.com/-3vFmDlRHhvw/AAAAAAAAAAI/AAAAAAAAAAA/AMZuucnPJ2oz6s6aJ40P2gGevQYqRD8UkQ/s96-c/photo.jpg',
         locale: 'ru' } }
     */
    async login(accessToken, mode) {
        let userData = await this.getUserInfo(accessToken, mode);
        if (!userData || userData instanceof AuthError) {
            return {
                ok: false,
                type: 'error',
                error: new AuthError('Access restricted')
            };
        }
        console.log('hmmm', userData);
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_TWITTER, userData.user.id);
        if (apiUserCredential) {
            return await this.makeSession(apiUserCredential);
        }

        return {
            ok: false,
            type: 'register',
            twitterUser: userData.user,
        }
    }

    async register(data) {
        let twitterUser = data.twitterUser;
        let username = await userModel.generateUsername(twitterUser.name, 0);
        let credentials = [
            {
                type: CREDENTIAL_TYPE_USERNAME,
                credential: username
            },
            {
                type: CREDENTIAL_TYPE_TWITTER,
                credential: twitterUser.id
            }
        ];

        let apiUser = await apiUserModel.create([], credentials);
        if (!apiUser) return {
            ok: false,
            error: new UserRegisterError('cannot create api user')
        }
        await apiUserModel.setPassword(apiUser.uid, uuid4());

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
            error: new UserAuthCredentialError('Internal error')
        };
        await apiUserCredentialModel.add(apiUserCredential.uid, CREDENTIAL_TYPE_TWITTER, userData.id);
        return await this.makeSession(apiUserCredential);
    }

    async addCredential(uid: string, id){
        await apiUserCredentialModel.add(uid, CREDENTIAL_TYPE_TWITTER, id);
    }

}

export default new AuthTwitterModel();
