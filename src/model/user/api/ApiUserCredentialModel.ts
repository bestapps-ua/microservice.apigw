'use strict';


import ApiUserCredential from "../../../entity/user/api/ApiUserCredential";
import appModel from "../../AppModel";

class ApiUserCredentialModel {

    async find(type: string, credential: any): Promise<ApiUserCredential> {
        let userCredential;
        try {
            let userCredentials = await appModel.broker.call("user.credential.find", {
                credentials: [{
                    type,
                    credential,
                }]
            });

            if (!userCredentials[0]) throw 'no data';
            userCredential = new ApiUserCredential(userCredentials[0].data);
        } catch (err) {
            console.log('[err find]', type, credential, err);
        }
        return userCredential;
    }

    async getAll(uid: string) {
        let userCredentials = [];
        try {
            let apiUserCredentials = await appModel.broker.call("user.credential.getAll", {
                uid
            });
            for (let i = 0; i < apiUserCredentials.length; i++) {
                userCredentials.push(new ApiUserCredential(apiUserCredentials[i].data));
            }
        } catch (err) {
            //console.log('[err getAll]', uid, err);
        }
        return userCredentials;
    }

    async add(uid: string, type: string, credential: string) {
        let userCredential;
        try {
            let apiUserCredential = await appModel.broker.call("user.credential.set", {
                uid,
                type,
                credential,
            });
            if (!apiUserCredential) throw 'no data';
            userCredential = new ApiUserCredential(apiUserCredential.data);
        } catch (err) {
            console.log('[err add]', uid, type, credential, err);
        }
        return userCredential;
    }


    async update(uid: string, type: string, credentialPrev: string, credential: string) {
        let userCredential;

        try {
            let user = await appModel.broker.call("user.get", {
                uid,
            });
            let apiUserCredential = await appModel.broker.call("user.credential.set", {
                uid,
                type,
                credential,
            });
            if (!apiUserCredential) throw 'no data';
            await appModel.broker.call("user.credential.remove", {
                user, credential: credentialPrev, type
            });
            userCredential = new ApiUserCredential(apiUserCredential.data);
        } catch (err) {
            console.log('[err add]', uid, type, credential, err);
        }
        return userCredential;
    }
}

export default new ApiUserCredentialModel();
