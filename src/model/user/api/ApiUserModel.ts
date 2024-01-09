'use strict';

import {CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_PHONE, CREDENTIAL_TYPE_USERNAME} from "../UserCredentialType";
import ApiUser from "../../../entity/user/api/ApiUser";
import appModel from "../../AppModel";
import apiUserCredentialModel from "./ApiUserCredentialModel";
import apiUserParamModel from "./ApiUserParamModel";
import User from "../../../entity/user/User";


let uuid4 = require('uuid/v4');


class ApiUserModel {

    async generateUid() {
        let uid = uuid4();
        let apiUser = await this.get(uid);
        if (apiUser) return this.generateUid();
        return uid;
    }

    async create(params: any = [], credentials: any = []): Promise<ApiUser> {
        let user;
        try {
            user = await appModel.broker.call("user.create", {
                uid: await this.generateUid(),
                params,
                credentials,
            });

            user = new ApiUser(Object.assign(user.data, {isNew: true}));
        } catch (err) {
            console.log('[err create]', params, credentials, err);
        }
        return user;
    }

    async get(uid: string) {
        let user;
        try {
            user = await appModel.broker.call("user.get", {
                uid,
            });
            user = new ApiUser(Object.assign(user.data, {isNew: false}));
        } catch (err) {
            //console.log('[err get]', uid, err);
        }
        return user;
    }

    async setPassword(uid: string, password: string) {
        let user;
        try {
            user = await appModel.broker.call("user.get", {
                uid,
            });
            if (user) await appModel.broker.call("user.setPassword", {
                user, password
            });

        } catch (err) {
            console.log('[err setPassword]', uid, password, err);
        }
        return user;
    }

    async getList(params) {
        try {
            return await appModel.broker.call("user.list", params);
        } catch (err) {
            console.log('[err getList]', err);
        }
    }

    async findByPhone(phone) {
        let userCredential = await apiUserCredentialModel.find(CREDENTIAL_TYPE_PHONE, phone);
        let user;
        if (!userCredential) return user;
        //console.log('[u]', userCredential);
        return await this.get(userCredential.uid);
    }

    async setPhone(uid: string, phone: string) {
        return await apiUserCredentialModel.add(uid, CREDENTIAL_TYPE_PHONE, phone);
    }

    async setUsername(user: User, username: string) {
        return await apiUserCredentialModel.update(user.uid, CREDENTIAL_TYPE_USERNAME, user.getUsername(), username);
    }

    async setFirstLastName(user: User, firstName: string, lastName: string) {
        await apiUserParamModel.set(user.uid, 'firstName', firstName);
        await apiUserParamModel.set(user.uid, 'lastName', lastName);
    }

    async setEmail(user: User, email: string) {
        return await apiUserCredentialModel.update(user.uid, CREDENTIAL_TYPE_EMAIL, user.getEmail(), email);
    }

    async remove(uid: string) {
        try {
            await appModel.broker.call("user.remove", {
                uid,
            });
        } catch (err) {
            console.log('[err remove]', uid, err);
        }
    }

    async encryptPassword(password: string) {
        let encryptedPassword;
        try {
            encryptedPassword = await appModel.broker.call("user.encryptPassword", {
                password,
            });
        } catch (err) {
            console.log('[err encryptPassword]', password, err);
        }
        return encryptedPassword;
    }


}

export default new ApiUserModel();
