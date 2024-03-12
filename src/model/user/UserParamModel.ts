'use strict';
import appModel from "../AppModel";
import UserParam from "../../entity/user/UserParam";

import { v4 as uuidv4 } from 'uuid';

class UserParamModel {
    async getAll(uid) {
        let userParams = [];
        try {
            let apiUserParams = await appModel.broker.call("user.param.getAll", {
                uid
            });
            for (let i = 0; i < apiUserParams.length; i++) {
                userParams.push(new UserParam(apiUserParams[i].data));
            }
        } catch (err) {
            //console.log('[err getAll]', uid, err);
        }
        return userParams;
    }

    async set(uid, key, value) {
        let userParam;
        try {
            let apiUserParam = await appModel.broker.call("user.param.set", {
                uid,
                key,
                value
            });
            if (!apiUserParam) throw 'no data';
            userParam = new UserParam(apiUserParam.data);
        } catch (err) {
//            console.log('[err set]', uid, key, value, err);
        }
        return userParam;
    }

    async get(user, key) {
        let userParam;
        try {
            let apiUserParam = await appModel.broker.call("user.param.get", {
                user: user,
                key
            });
            if (!apiUserParam) throw 'no data';
            userParam = new UserParam(apiUserParam.data);
        } catch (err) {
//            console.log('[err get]', user, key, err);
        }
        //console.log('USERPARAM', userParam);
        return userParam;
    }

    async getByKey(user, key) {
        let userParam;
        try {
            let userData = await appModel.broker.call("user.param.get", {
                user,
                key
            });
            if (!userData) throw 'no data';
            userParam = userData.data.value;
            return userParam === '' ? userParam : JSON.parse(userParam);
        } catch (err) {
            console.log('[err getByKey]', user, key, err);
        }
    }

    async getOrCreateHash(user) {
        let hash = await this.get(user, 'hash');
        if (!hash) {
            hash = uuidv4();
            await this.set(user.uid, 'hash', hash);
        } else {
            hash = hash['value'];
        }
        return hash;
    }

    async searchByKeys(keys: string[], value: string): Promise<UserParam[]> {
        let userParams = [];
        try {
            let apiUserParams = await appModel.broker.call("user.param.searchByKeys", {
                keys,
                value,
            });
            for (let i = 0; i < apiUserParams.length; i++) {
                userParams.push(new UserParam(apiUserParams[i].data));
            }
        } catch (err) {
            console.log('[err searchByKeys]', keys, value, err);
        }
        return userParams;
    }

    async setPushSettings(uid: string, notifications) {
        let keys = Object.keys(notifications);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            await this.set(uid, `push::config::${key}`, notifications[key]);
        }
    }

    /**
     * TODO: md5
     * @param uid
     * @param token
     */
    async addPushToken(uid: string, token: string) {
        let key = uuidv4();
        await this.set(uid, `push::web::${key}`, token);
    }

    async remove(uid: string, key: string) {
        try {
            let res = await appModel.broker.call("user.param.remove", {
                uid,
                key
            });
            return res;
        } catch (err) {
            console.log('[err remove]', uid, key, err);
        }
    }

    async getFakeUsers() {
        try {
            let res = await this.searchByKeys(['isFake'], '1');
            return res;
        } catch (err) {
            console.log('[err remove]', err);
        }
    }
}

export default new UserParamModel();
