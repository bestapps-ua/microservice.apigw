import EntitySQLModel from "@bestapps/microservice-entity/dist/model/entity/EntitySQLModel";
import BestApps from "@bestapps/microservice-entity";
import IEntitySQLModelOptions = BestApps.interfaces.IEntitySQLModelOptions;
import UserLog from "../../entity/user/UserLog";
import UserModel from "./UserModel";
import userSessionModel from "./UserSessionModel";
import {ca} from "date-fns/locale";

let options: IEntitySQLModelOptions = {
    table: 'user_log',
    //@ts-ignore
    entity: UserLog,
    schemas: [
        {
            field: 'user',
            source: {
                id: "user_id",
                model: UserModel,
            },
            isLazy: true,
            optional: true,
        },
        {
            field: 'session',
            source: {
                id: 'sid',
                callback: (id, callback) => {
                    (async () => {
                        try {
                            const session = await userSessionModel.getBySid(id as string);
                            callback && callback(undefined, session);
                        } catch (e) {
                            callback && callback(e);
                        }
                    })();
                },
            },
            isLazy: true,
            optional: true,
        },
        {
            field: 'action',
        },
        {
            field: 'request',
            type: 'json'
        },
        {
            field: 'response',
            type: 'json'
        },
    ],
    make: {}
};

class UserLogModel extends EntitySQLModel {

}

export default new UserLogModel(options);
