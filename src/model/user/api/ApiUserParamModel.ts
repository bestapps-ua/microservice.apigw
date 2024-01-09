'use strict';

import appModel from "../../AppModel";
import ApiUserParam from "../../../entity/user/api/ApiUserParam";

class ApiUserParamModel {
    async getAll(uid: string){
        let userParams = [];
        try {
            let apiUserParams = await appModel.broker.call("user.param.getAll", {
                uid
            });
            for(let i = 0; i < apiUserParams.length; i++){
                userParams.push(new ApiUserParam(apiUserParams[i].data));
            }
        }catch (err) {
            //console.log('[err getAll]', uid, err);
        }
        return userParams;
    }

    async set(uid: string, key: string, value: string){
        let userParam;
        try {
            let apiUserParam = await appModel.broker.call("user.param.set", {
                uid,
                key,
                value,
            });
            if(!apiUserParam) throw 'no data';
            userParam = new ApiUserParam(apiUserParam.data);
        }catch (err) {
            console.log('[err set]', uid, key, value, err);
        }
        return userParam;
    }

    async remove(uid: string, key: string){
        try {
            let result = await appModel.broker.call("user.param.remove", {
                uid,
                key
            });
        }catch (err) {
            console.log('[err remove]', uid, key, err);
            return false;
        }
        return true;
    }
}

export default new ApiUserParamModel();
