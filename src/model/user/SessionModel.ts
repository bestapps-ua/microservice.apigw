'use strict';
import UserSession from "../../entity/user/UserSession";
import apiUserSessionModel from "./api/ApiUserSessionModel";
import ApiUserSession from "../../entity/user/api/ApiUserSession";
import userModel from "./UserModel";
import User from "../../entity/user/User";

let momentTz = require('moment-timezone');

class SessionModel {
    async create(item: UserSession): Promise<UserSession> {
        try {
            let apiUserSession = await apiUserSessionModel.create(item.user.uid);
            if (!apiUserSession) return;
            let userSession: UserSession = await new Promise((resolve, reject) => {

                this.make(apiUserSession, (err, userSession) => {
                    resolve(userSession);
                });
            });
            return userSession;
        }catch (err){
            console.log('err create', err);
        }
    }

    async createAnonymous(){
        try {
            let apiUserSession = await apiUserSessionModel.createAnonymous();
            if (!apiUserSession) return;
            let userSession: UserSession = await new Promise((resolve, reject) => {
                this.make(apiUserSession, (err, userSession) => {
                    resolve(userSession);
                });
            });
            return userSession;
        }catch (err){
            console.log('err createAnonymous', err);
        }
    }

    async getBySid(sid: string): Promise<UserSession> {
        let apiUserSession = await apiUserSessionModel.getBySid(sid);
        if (!apiUserSession) return;
        let userSession: UserSession = await new Promise((resolve, reject) => {
            this.make(apiUserSession, (err, userSession) => {
                resolve(userSession);
            });
        });
        return userSession;
    }

    async getActiveByUser(userId: string): Promise<UserSession> {
        let apiUserSession = await apiUserSessionModel.getLastByUserId(userId);
        if (!apiUserSession) return;
        let userSession: UserSession = await new Promise((resolve, reject) => {
            this.make(apiUserSession, (err, userSession) => {
                resolve(userSession);
            });
        });
        return userSession;
    }

    make(data: ApiUserSession, callback) {
        let p = [];
        let itemData: any = {
            sid: data.sid,
            user: undefined,
        };

        if(!data.userId.includes('anonymous')) {
            p.push(new Promise(async (resolve, reject) => {
                userModel.getByUid(data.userId, (err, user) => {
                    if (!user) return reject(err);
                    itemData.user = user;
                    resolve(undefined);
                });
            }));
        }

        return new Promise((resolve, reject) => {
            Promise.all(p).then(() => {
                callback && callback(undefined, new UserSession(itemData));
            }).catch((err) => {
                console.log('[err make]', err);
                callback && callback(err, new UserSession(itemData));
            });
        });
    }

    async getOrCreate(item: UserSession): Promise<UserSession> {
        let userSession = await this.getActiveByUser(item.user.uid);
        if(userSession) return userSession;
        return await this.create(item);
    }

    async logout(item: UserSession){
        await apiUserSessionModel.close(item.sid);
    }

    async setUser(session: UserSession, user: User){
        await apiUserSessionModel.setUserId(session.sid, user.uid);
        return await this.getBySid(session.sid);
    }

    async touch(session: UserSession, options = {}): Promise<UserSession> {
        try {
            let apiUserSession = await apiUserSessionModel.touch(session.sid, options);
            if (!apiUserSession) return;
            let userSession: UserSession = await new Promise((resolve, reject) => {
                this.make(apiUserSession, (err, userSession) => {
                    resolve(userSession);
                });
            });
            return userSession;
        }catch (err){
            console.log('err touch', err);
        }
    }
}

export default SessionModel;
