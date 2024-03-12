import userSessionModel from "./model/user/UserSessionModel";

import { v4 as uuidv4 } from 'uuid';
const E = require("moleculer-web").Errors;
let config = require('config');
const ApiService = require("moleculer-web");

let path = require('path');
const {MoleculerError} = require("moleculer").Errors;
import moleculerActionsAuth from '../src/actions/actions.auth';
import moleculerActionsInternal from '../src/actions/actions.internal';
import moleculerActionsMy from '../src/actions/actions.my';
import UserAuthSessionError from "./entity/error/user/user.auth.session.error";
import authCodeModel from "./model/auth/AuthCodeModel";
import NotFoundError from "./entity/error/not.found.error";
import secureModel from "./model/SecureModel";
import UserLog from "./entity/user/UserLog";
import userLogModel from "./model/user/UserLogModel";

function addLog(req, user?, session?, data?, meta?, err?) {
    (async () => {
        try {
            let authCode;
            let decryptData;
            if (session) {
                try {
                    if (req.originalUrl.includes('api/login')) {
                        authCode = await authCodeModel.getLastNewBySid(session.user, session.sid);
                    } else {
                        authCode = await authCodeModel.getStarted(session.sid);
                    }
                    if (authCode && data.secureData) {
                        let params = await secureModel.decrypt(authCode, data.secureData);
                        decryptData = params;

                    }
                } catch (e) {
                    console.log('err addToLog decrypt', e, session && session.uid);
                }
            }
            let response = decryptData || data;
            if (err) {
                response = err;
            }

            let d = new UserLog({
                user,
                session,
                action: req.originalUrl,
                request: (meta && meta.params) || req.body || {},
                response,
            });
            userLogModel.createAsync(d);
            //console.log(d);
        } catch (e) {
            console.log('err addToLog', e);
        }
    })();
}

function onAfterCall(ctx, route, req, res, data) {
    const user = ctx.meta.user;
    let session = ctx.meta.session;
    let sid = req.headers['sid'];
    (async () => {
        if (!session && sid) {
            try {
                session = await userSessionModel.getBySid(sid);
            } catch (e) {

            }
        }
        addLog(req, user, session, data, ctx.meta);
    })();

    return data;
}

function onError(req, res, err) {
    addLog(req, undefined, undefined, undefined, undefined, err);
    res.end(JSON.stringify(err));
}

class MoleculerActions {

    constructor() {
    }

    generateCors(data) {
        let cors = {
            origin: "*",
            methods: ["GET", "OPTIONS", "HEAD", "POST", "PUT", "DELETE"],
            allowedHeaders: ['*'],
            exposedHeaders: ['*'],
            credentials: false,
            maxAge: null
        };

        data.cors = cors;
        return data;
    }

    generateMixins(mixins = []) {
        if (!config.service.port) return mixins;
        mixins.push(ApiService);
        return mixins;
    }

    generateSettings(settings = {}) {
        if (!config.service.port) return settings;
        settings = Object.assign(settings, {
            routes: [
                {
                    bodyParsers: {
                        json: {limit: 1024 * 1024 * 50}
                    },

                    path: "/auth",

                    onAfterCall,
                    onError,

                    aliases: {
                        "POST init": `${config.service.name}.initAuthCode`,
                        "POST code": `${config.service.name}.sendAuthCode`,
                    },
                    mappingPolicy: "restrict",
                },
                {
                    bodyParsers: {
                        json: {limit: 1024 * 1024 * 50}
                    },

                    async onBeforeCall(ctx, route, req, res) {
                        // Set request headers to context meta
                        let secureData = req.body.secureData;
                        let sid = req.headers['sid'];

                        if (secureData && sid) {
                            let session = await userSessionModel.getBySid(sid);
                            if (session) {
                                let authCode;
                                if(session.user) {
                                    if (req.originalUrl.includes('api/login')) {
                                        authCode = await authCodeModel.getLastNewBySid(session.user, session.sid);
                                    } else {
                                        authCode = await authCodeModel.getStarted(session.sid);
                                    }
                                }
                                if (authCode) {
                                    try {
                                        let params = await secureModel.decrypt(authCode, secureData);
                                        ctx.meta.params = params;
                                    } catch (e) {
                                        console.log('err onBeforeCall decrypt', e, sid);
                                    }
                                }
                            }
                            //TODO: parse and set ctx.params based on that
                        }
                    },

                    onAfterCall,
                    onError,

                    path: "/api",

                    aliases: {
                        "POST login": `${config.service.name}.loginKey`,
                        "POST touch": `${config.service.name}.touch`,
                        "POST filter": `${config.service.name}.filter`,
                        "POST groups": `${config.service.name}.getGroups`,
                        "POST my/profile": `${config.service.name}.getMyProfile`,
                        "POST message/attachment": `${config.service.name}.getMessageAttachment`,
                    },
                    authentication: true,
                    mappingPolicy: "restrict",
                },
                {
                    bodyParsers: {
                        json: {limit: 1024 * 1024 * 50}
                    },

                    onAfterCall,
                    onError,

                    path: "/internal",

                    aliases: {
                        "POST generate/user": `${config.service.name}.generateUser`,
                        "POST listen": `${config.service.name}.listen`,
                        "POST process": `${config.service.name}.processMessages`,
                        "POST new/message": `${config.service.name}.newMessage`,
                        "POST auth/clear": `${config.service.name}.authClear`,
                    },
                    mappingPolicy: "restrict",
                },
            ],
            /*
            assets: {
                 folder: "./data/audio",
                 options: {}
             },

             */
            port: config.service.port
        });
        settings = this.generateCors(settings);
        //console.log('[SETTINGS]', JSON.stringify(settings));
        return settings;
    }

    generateMethods(methods = {}) {
        return {
            authenticate(ctx, route, req, res) {
                let sid = req.headers.sid;
                let isSecure = true;
                if (req.headers['x-backdoor-secure']) {
                    isSecure = req.headers['x-backdoor-secure'] !== 'false';
                }
                return new Promise(async (resolve, reject) => {
                    //console.log('ORIGINAL URL', req.originalUrl);
                    try {
                        if (!sid) {
                            if (!sid) throw 'access restricted';
                        }

                        let session = await userSessionModel.getBySid(sid);
                        if (!session) throw 'not found';
                        let user = session.user;
                        ctx.meta.user = user;
                        ctx.meta.session = session;
                        let last;

                        if(user) {
                            if (req.originalUrl.includes('api/login')) {
                                last = await authCodeModel.getLastNewBySid(user, session.sid);
                                if (!last) {
                                    throw 'expired';
                                }
                            } else {
                                last = await authCodeModel.getStarted(session.sid);
                                if (!last) {
                                    throw 'expired';
                                }
                                await authCodeModel.touch(last);
                                await userSessionModel.touch(session, {
                                    maxPeriod: config.auth.token.livePeriod
                                });
                            }
                        }
                        ctx.meta.authCode = last;
                        ctx.meta.isSecure = isSecure;
                        return resolve(user);
                    } catch (e) {
                        console.log('[err authorize]', e);
                        if (e.message) {
                            return reject(new UserAuthSessionError('wrong sid'));
                        }
                        return reject(new UserAuthSessionError(e));
                    }
                });
            }
        }

    }

    generateActions(actions = {}) {
        actions = moleculerActionsAuth.generate(actions);
        actions = moleculerActionsInternal.generate(actions);
        actions = moleculerActionsMy.generate(actions);

        return actions;
    }
}

export default MoleculerActions;
