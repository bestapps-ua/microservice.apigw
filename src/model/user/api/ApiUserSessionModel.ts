'use strict';

import appModel from "../../AppModel";
import ApiUserSession from "../../../entity/user/api/ApiUserSession";
import { v4 as uuidv4 } from 'uuid';
let config = require('config');

class ApiUserSessionModel {
    async create(uid, options: any = {}) {
        options = Object.assign({
            maxPeriod: config.service.session.period,
        }, options);
        let userSession;
        try {
            let res = await appModel.broker.call("user.session.create", {
                userId: uid,
                maxPeriod: options.maxPeriod,
            });
            if (res) userSession = new ApiUserSession(res.data);
        } catch (err) {
            console.log('[err create]', uid, err);
        }
        return userSession;
    }

    async getBySid(sid) {
        let userSession;
        try {
            let res = await appModel.broker.call("user.session.getBySid", {sid});
            if (res) userSession = new ApiUserSession(res.data);
        } catch (err) {
            console.log('[err getBySid]', sid, err);
        }
        return userSession;
    }

    async getAllActive() {
        let userActiveSessions = [];
        try {
            let res = await appModel.broker.call("user.session.getAllActive", {});
            if (res.length) {
                userActiveSessions = res.map(session => new ApiUserSession({...session, userId: session.uid})
                )
            }
        } catch (err) {
            console.log('[err getAllActive]', err);
        }
        return userActiveSessions;
    }

    async getLastByUserId(userId) {
        let userSession;
        try {
            let res = await appModel.broker.call("user.session.getLastByUserId", {userId});
            if (res) userSession = new ApiUserSession(res.data);
        } catch (err) {
            console.log('[err getLastByUserId]', userId, err);
        }
        return userSession;
    }

    async close(sid) {
        try {
            let res = await appModel.broker.call("user.session.close", {sid});
        } catch (err) {
            console.log('[err close]', sid, err);
        }
    }

    async createAnonymous(){
        return await this.create(`anonymous.${uuidv4()}`, {
            maxPeriod: config.auth.token.activatePeriod,
        });
    }

    async setUserId(sid: string, userId: string){
        try {
            let res = await appModel.broker.call("user.session.setUserId", {
                sid,
                userId,
            });
        } catch (err) {
            console.log('[err setUser]', err);
        }
    }

    async touch(sid, options: any= {}) {
        let userSession;
        try {
            let res = await appModel.broker.call("user.session.touch", Object.assign({}, {sid}, options));
            if (res) userSession = new ApiUserSession(res.data);
        } catch (err) {
            console.log('[err touch]', sid, err);
        }
        return userSession;
    }
}

export default new ApiUserSessionModel();
