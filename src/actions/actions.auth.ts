import UserRegisterPinError from "../entity/error/user/user.register.pin.error";
import UserForgotPasswordPinError from "../entity/error/user/user.forgot.password.pin.error";
import ExistError from "../entity/error/exist.error";
import EmptyError from "../entity/error/empty.error";
import authModel from "../model/auth/AuthModel";
import NotFoundError from "../entity/error/not.found.error";
import InternalError from "../entity/error/internal.error";
import apiUserCredentialModel from "../model/user/api/ApiUserCredentialModel";
import {CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_USERNAME} from "../model/user/UserCredentialType";
import userPinModel from "../model/user/UserPinModel";
import userParamModel from "../model/user/UserParamModel";
import UserPin from "../entity/user/UserPin";
import authCodeModel from "../model/auth/AuthCodeModel";
import userSessionModel from "../model/user/UserSessionModel";
import responseModel from "../model/ResponseModel";

import { v4 as uuidv4 } from 'uuid';

let config = require('config');

function getSecuredParam(ctx: any, key: string) {
    return (ctx.meta && ctx.meta.params && ctx.meta.params[key]) || ctx.params[key];
}

class MoleculerActionsAuth {
    generate(actions) {
        return Object.assign(actions, {

            //TODO: use in admin
            async register(ctx) {

                let email = `${ctx.params.email}`.trim();
                let username = `${ctx.params.username}`.trim();
                let pin = ctx.params.pin;
                let token = ctx.params.token;
                let password = ctx.params.password;
                let sendNotifications = ctx.params.sendNotifications;
                let webNotificationToken = ctx.params.webNotificationToken;
                let type = ctx.params.type || 'email';
                let accessToken = ctx.params.accessToken;

                let data = {
                    email,
                    username,
                    password,
                    sendNotifications,
                };

                let p = new Promise(async (resolve, reject) => {
                    if (email === '') return reject(new NotFoundError('email'));
                    if (username === '') return reject(new NotFoundError('username'));
                    if (type !== 'email' && !accessToken) return reject(new NotFoundError('accessToken'));
                    if (type === 'email' && !password) {
                        return reject(new NotFoundError('password'));
                    } else {
                        password = uuidv4();
                    }
                    let otherUser = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, email);
                    if (otherUser) return reject(new ExistError('User with that email exists'));
                    otherUser = await apiUserCredentialModel.find(CREDENTIAL_TYPE_USERNAME, username);
                    if (otherUser) return reject(new ExistError('User with that username exists'));


                    let socialAuthResult: any;
                    let socialEmail;
                    let socialUser;
                    if (type !== 'email') {
                        if (socialAuthResult.ok === true) {
                            return resolve({
                                ok: true,
                                uid: socialAuthResult.user.uid,
                                sid: socialAuthResult.sid
                            });
                        }

                        socialUser = socialAuthResult[`${type}User`];
                        socialEmail = socialUser.email;

                        //means user entered email already - we must check is he registered and provide type login in that case (user will login by email)
                        if (email) {
                            let otherUser = await apiUserCredentialModel.find(CREDENTIAL_TYPE_EMAIL, email);
                            if (otherUser) {
                                return resolve({
                                    ok: false,
                                    type: 'login',
                                    data: {
                                        email,
                                    }
                                });
                            }
                        }
                    }

                    if (!pin && ((type === 'email') || (type !== 'email' && (!socialEmail || socialEmail !== email)))) {
                        try {
                            let userPin = await userPinModel.sendEmailPin(undefined, email) as UserPin;
                            return resolve({
                                ok: false,
                                token: userPin.token,
                                type: 'pin'
                            });
                        } catch (err) {
                            return reject(new InternalError('pin generation error'));
                        }
                    }
                    let resPin;
                    if (pin) {
                        if (!token) return reject(new NotFoundError('token'));
                        let resPin = await userPinModel.validatePin(email, pin, token);
                        if (resPin.status !== true) {
                            return reject(new UserRegisterPinError(resPin.status));
                        }
                    }

                    let result: any = await authModel.register(data);

                    if (!result.ok) {
                        return reject(result.error);
                    }

                    if (webNotificationToken) {
                        await userParamModel.addPushToken(result.user.uid, webNotificationToken);
                    }

                    if (resPin) {
                        userPinModel.setFinished(result.user, resPin.pin, () => {

                        });
                    }
                    resolve({
                        ok: true,
                        sid: result.sid,
                        uid: result.user.uid,
                    });
                });
                return p;
            },

            //TODO: use in "admin"
            async isPhoneRegistered(ctx) {
                let phone = `${ctx.params.phone}`.trim();
                let p = new Promise(async (resolve, reject) => {
                    if (phone === '') return reject(new NotFoundError('phone'));

                    try {
                        let isRegistered = await authModel.isRegisteredPhone(phone);

                        //TODO: response model
                        resolve({
                            isRegistered,
                        });
                    } catch (err) {
                        return reject(new InternalError('Internal error'));
                    }
                });
                return p;
            },

            async checkSession(ctx) {
                let uid = ctx.params.uid;
                let user = ctx.meta.user;
                if (!uid) throw new NotFoundError('uid');

                if (!user) {
                    return {
                        ok: false,
                    }
                }
                return {
                    ok: uid === user.uid,
                }
            },

            async loginPhone(ctx) {
                let phone = ctx.params.phone;
                let password = ctx.params.password;
                let sid = ctx.params.sid;

                let data = {
                    phone,
                    password,
                };

                let p = new Promise(async (resolve, reject) => {
                    if (!phone) return reject(new NotFoundError('phone'));
                    if (!password) return reject(new NotFoundError('password'));
                    if (!sid) return reject(new NotFoundError('sid'));

                    try {
                        let result: any = await authModel.loginPhone(data);
                        if (!result.ok) {
                            return reject(result.error);
                        }
                        let authCode = await authCodeModel.getLastNewBySid(result.user, sid);
                        if(!authCode) {
                            return reject(new NotFoundError('permission denied'));
                        }
                        await authCodeModel.setStarted(authCode);
                        resolve({
                            ok: true,
                            data: {
                                sid: result.sid,
                                uid: result.user.uid,
                            }
                        });
                    } catch (err) {
                        return reject(new InternalError('Internal error'));
                    }

                });
                return p;
            },

            async loginKey(ctx) {
                let key = getSecuredParam(ctx, 'key');
                let password = getSecuredParam(ctx, 'password');
                let session = ctx.meta.session;
                let isSecure = ctx.meta.isSecure;
                let data = {
                    key,
                    password,
                };

                let p = new Promise(async (resolve, reject) => {
                    if (!key) return reject(new NotFoundError('key'));
                    if (!password) return reject(new NotFoundError('password'));
                    if (!session) return reject(new NotFoundError('session'));

                    try {


                        let result: any = await authModel.loginKey(data);
                        if (!result.ok) {
                            return reject(result.error);
                        }

                        let lastSession = await userSessionModel.getActiveByUser(result.user.uid);
                        if(!lastSession || lastSession.sid !== session.sid) {
                            return reject(new NotFoundError('sid'));
                        }

                        let authCode = await authCodeModel.getLastNewBySid(result.user, session.sid);
                        if(!authCode) {
                            return reject(new NotFoundError('permission denied'));
                        }
                        await authCodeModel.setStarted(authCode);
                        await userSessionModel.touch(session, {
                            maxPeriod: config.auth.token.livePeriod
                        });
                        resolve(await responseModel.getMyProfileSecuredResponse(authCode, isSecure, result.user));
                    } catch (err) {
                        return reject(new InternalError('Internal error'));
                    }

                });
                return p;
            },

            async initAuthCode(ctx){
                let session = await userSessionModel.createAnonymous();
                return await responseModel.getAuthCodeResponse(session)
            },

            async sendAuthCode(ctx) {

                let key = ctx.params.key;
                let sid = ctx.params.sid;
                return new Promise(async (resolve, reject) => {
                    if (!key) return reject(new NotFoundError('key'));
                    if (!sid) return reject(new NotFoundError('sid'));
                    try {
                        let user = await authModel.getUserByKey(key);
                        if (!user) {
                            return reject(new NotFoundError('key'));
                        }

                        let lastSession = await userSessionModel.getActiveByUser(user.uid);
                        if(lastSession && lastSession.sid !== sid) {
                            //return reject(new NotFoundError('sid'));
                        }
                        let authCode = await authCodeModel.getLast(user);
                        if (authCode && !authCodeModel.isExpired(authCode) && authCode.status === 'new') {
                            return reject(new ExistError(`code is active (${authCode.expires - Math.round(Date.now() / 1000)} s)`));
                        }
                        authCode = await authCodeModel.generate(user, sid);
                        let session = await userSessionModel.getBySid(sid);
                        await userSessionModel.setUser(session, user);
                        //TODO: make call to send pin

                        console.log('CODE:', authCode.uid);
                        return resolve(await responseModel.getSendAuthCodeResponse());
                    } catch (e) {
                        console.log('error sendAuthCode', {sid, key, e});
                        return reject(new InternalError('Internal error'));
                    }
                });
            },

            async touch(ctx) {
                let session = ctx.meta.session;
                let authCode = ctx.meta.authCode;
                let isSecure = ctx.meta.isSecure;
                return new Promise(async (resolve, reject) => {
                    if(!session) return reject(new NotFoundError('session'));
                    try {
                        let last = await authCodeModel.getStarted(session.sid);
                        if(!last) {
                            return reject(new NotFoundError('no session'));
                        }
                        await authCodeModel.touch(last);
                        await userSessionModel.touch(session, {
                            maxPeriod: config.auth.token.livePeriod
                        });
                        return resolve(await responseModel.getSessionTouchSecureResponse(authCode, isSecure));
                    }catch(e){
                        console.log('error touch', {e, session});
                        return reject(new InternalError('Internal error'));
                    }
                });
            }
        });


    }
}

export default new MoleculerActionsAuth();
