import EntitySQLModel from "@bestapps/microservice-entity/dist/model/entity/EntitySQLModel";
import BestApps from "@bestapps/microservice-entity";
import IEntitySQLModelOptions = BestApps.interfaces.IEntitySQLModelOptions;
import User from "../../entity/user/User";
import apiUserModel from "./api/ApiUserModel";
import apiUserCredentialModel from "./api/ApiUserCredentialModel";
import apiUserParamModel from "./api/ApiUserParamModel";
import UserRegisterError from "../../entity/error/user/user.register.error";
import {CREDENTIAL_TYPE_EMAIL, CREDENTIAL_TYPE_KEY, CREDENTIAL_TYPE_PHONE} from "./UserCredentialType";
let md5 = require('md5');
let uuid4 = require('uuid/v4');

let options: IEntitySQLModelOptions = {
    table: 'user',
    //@ts-ignore
    entity: User,
    schemas: [

    ],
    make: {
        onAfter: (source, props, callback) => {
            let p = [];
            p.push(new Promise(async (resolve, reject) => {
                try {
                    let apiUser = await apiUserModel.get(props.uid);
                    props.apiUser = apiUser;
                    resolve(undefined);
                } catch (e) {
                    console.log('[err make]', e);
                    reject(e);
                }
            }));

            p.push(new Promise(async (resolve, reject) => {
                try {
                    let credentials = await apiUserCredentialModel.getAll(props.uid);
                    let allowedTypes = ['phone', 'key', 'telegram.id', 'telegram.username']
                    props.credentials = credentials.filter(credential => allowedTypes.includes(credential.type))
                    resolve(undefined);
                } catch (e) {
                    reject(e);
                }
            }));

            p.push(new Promise(async (resolve, reject) => {
                try {
                    let params = await apiUserParamModel.getAll(props.uid);

                    for (let i = 0; i < params.length; i++) {
                        props.params.set(params[i].key, params[i].value);
                    }

                    resolve(undefined);
                } catch (e) {
                    reject(e);
                }
            }));

            Promise.all(p).then(() => {
                callback && callback();
            }).catch((err) => {
                console.log('[err make.onAfter]', err);
                callback && callback();
            });
        }
    }
};

class UserModel extends EntitySQLModel {
    generateUid(entity: User, callback: any) {
        callback && callback(undefined, entity.apiUser.uid);
    }

    //TODO: only if FROM is allowed (SUPER ADMIN)
    async generateByPhone(phone: string){
        let credentials = [];
        credentials.push(
            {
                type: CREDENTIAL_TYPE_PHONE,
                credential: phone
            }
        );
        credentials.push(
            {
                type: CREDENTIAL_TYPE_KEY,
                credential: uuid4()
            }
        );
        let params = [];
        let apiUser = await apiUserModel.create(params, credentials);
        if (!apiUser) return {
            ok: false,
            error: new UserRegisterError('cannot create api user')
        }
        let password = md5(uuid4()).substring(0, 10);
        await apiUserModel.setPassword(apiUser.uid, password);
        let userData = new User({
            uid: apiUser.uid,
        });

        let user = await this.createAsync(userData) as User;
        return {
            user,
            password,
        }
    }
}

export default new UserModel(options);
