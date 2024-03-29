'use strict';
import appModel from '../app_model';
import AuthError from "../../entity/api/auth/auth_error";
import apiUserCredentialModel from "../user/api/api_user_credential_model";
import {
    CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_FACEBOOK,
    CREDENTIAL_TYPE_GOOGLE,
    CREDENTIAL_TYPE_PHONE,
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
import { v4 as uuidv4 } from 'uuid';


class AuthGoogleModel {

    async getAuthUrl(scopes, mode, redirectUrl = null, accessType = 'offline', responseType = 'code') {
        let res;
        try {
            res = await appModel.broker.call("google.oauth2.getAuthUrl", {
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
            res = await appModel.broker.call("google.oauth2.getTokenByCode", {
                mode,
                code,
            });
        } catch (err) {
            res = new AuthError(err);
        }
        return res;
    }

    async getUserInfo(accessToken) {
        let res;
        try {
            res = await appModel.broker.call("google.oauth2.getUserInfo", {
                accessToken,
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
    async login(accessToken) {
        let userData = await this.getUserInfo(accessToken);
        if (!userData || userData instanceof AuthError) {
            return {
                ok: false,
                type: 'error',
                error: new AuthError('Access restricted')
            };
        }
        let apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_GOOGLE, userData.user.id);
        if (apiUserCredential) {
            return await this.makeSession(apiUserCredential);
        }

        if (userData.user.verified_email) {
            apiUserCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, userData.user.email);
            if (apiUserCredential) {
                return {
                    ok: false,
                    type: 'login',
                    data: {
                        email: userData.user.email
                    }
                }
             //   return await this.makeSession(apiUserCredential);
            }

        }
        if(!userData.user.verified_email) userData.user.email = undefined;
        return {
            ok: false,
            type: 'register',
            googleUser: userData.user,
        }
    }

    async register(data) {
        let googleUser = data.googleUser;
        let username = await userModel.generateUsername(googleUser.name, 0);
        let credentials = [
            {
                type: CREDENTIAL_TYPE_USERNAME,
                credential: username
            },
            {
                type: CREDENTIAL_TYPE_GOOGLE,
                credential: googleUser.id
            }
        ];
        if (googleUser.verified_email) {
            credentials.push({
                type: CREDENTIAL_TYPE_EMAIL,
                credential: googleUser.email
            });
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
        await apiUserCredentialModel.add(apiUserCredential.uid, CREDENTIAL_TYPE_GOOGLE, userData.id);
        return await this.makeSession(apiUserCredential);
    }

    async addCredential(uid: string, id){
        await apiUserCredentialModel.add(uid, CREDENTIAL_TYPE_GOOGLE, id);
    }

}

export default new AuthGoogleModel();
