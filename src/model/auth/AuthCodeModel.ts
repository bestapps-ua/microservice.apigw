import EntitySQLModel from "@bestapps/microservice-entity/dist/model/entity/EntitySQLModel";
import User from "../../entity/user/User";
import BestApps from "@bestapps/microservice-entity";
import IEntitySQLModelOptions = BestApps.interfaces.IEntitySQLModelOptions;
import UserModel from "../user/UserModel";
import AuthCode from "../../entity/auth/AuthCode";
import sql from "../SQLModel";

let config = require('config');

const STATUS_NEW = 'new';
const STATUS_STARTED = 'started';
const STATUS_EXPIRED = 'expired';

let options: IEntitySQLModelOptions = {
    table: 'auth_code',
    //@ts-ignore
    entity: AuthCode,
    schemas: [
        {
            field: 'user',
            source: {
                id: "user_id",
                model: UserModel,
            },
            isLazy: true,
        },
        {
            field: 'sessionId',
            source: {
                id: "session_id",
            },
            optional: true,
        },
        {
            field: 'status',
        },
        {
            field: 'expires',
        }
    ],
};

class AuthCodeModel extends EntitySQLModel {
    async generate(user: User, sid: string) {
        let entity = new AuthCode({
            user,
            status: STATUS_NEW,
            sessionId: sid,
            expires: this.getExpiredActivate(),
        });
        return await this.createAsync(entity);
    }

    async getLast(user: User) {
        let items = await this.getItemsAsync({
            where: [
                {
                    key: 'user_id',
                    value: user.id,
                },
                {
                    key: 'status',
                    equal: '!=',
                    value: STATUS_EXPIRED,
                },
            ],
            sort: {
                field: 'id',
                order: 'desc',
            },
            limit: 1,
        });

        if (items.length === 0) {
            return;
        }

        return items[0];
    }

    //use in auth
    async getLastNewBySid(user: User, sid: string) {
        let params = {
            where: [
                {
                    key: 'session_id',
                    value: sid,
                },
                {
                    key: 'user_id',
                    value: user.id,
                },
                {
                    key: 'status',
                    value: STATUS_NEW,
                }
            ],
            sort: {
                field: 'id',
                order: 'desc',
            },
            limit: 1,
        };
        //console.log('>>>>', params, user, sid);
        let items = await this.getItemsAsync(params);

        if (items.length === 0) {
            return;
        }

        let last = items[0];

        if (this.isExpired(last)) {
            return;
        }
        return last;
    }

    async getLastActiveBySid(sid: string) {
        let items = await this.getItemsAsync({
            where: [
                {
                    key: 'session_id',
                    value: sid,
                },
                {
                    key: 'status',
                    value: STATUS_STARTED,
                }
            ],
            sort: {
                field: 'id',
                order: 'desc',
            },
            limit: 1,
        });

        if (items.length === 0) {
            return;
        }

        return items[0];
    }

    async getStarted(sid: string) {
        let last = await this.getLastActiveBySid(sid);

        if (!last) {
            return;
        }

        if (this.isExpired(last)) {
            return;
        }
        return last;
    }

    isExpired(authCode: AuthCode) {
        return Date.now() / 1000 > authCode.expires;
    }

    async setStarted(authCode: AuthCode) {
        authCode.status = STATUS_STARTED;
        authCode.expires = this.getExpiredLive();
        return this.updateAsync(authCode);
    }

    async setExpired(authCode: AuthCode) {
        authCode.status = STATUS_EXPIRED;
        return this.updateAsync(authCode);
    }

    async touch(authCode: AuthCode) {
        authCode.expires = this.getExpiredLive();
        return this.updateAsync(authCode);
    }

    getExpiredActivate(){
        return Math.round(Date.now() / 1000 + config.auth.token.activatePeriod);
    }

    getExpiredLive(){
        return Math.round(Date.now() / 1000 + config.auth.token.livePeriod);
    }

    async getAllLive(): Promise<AuthCode[]> {
        let items: AuthCode[] = await this.getItemsAsync({
            where: [
                {
                    key: 'status',
                    value: STATUS_STARTED,
                },
                {
                    key: 'expires',
                    equal: '>=',
                    value: Date.now() / 1000,
                },
            ],
        }) as AuthCode[];
        return items;
    }

    async getAllLiveSids(): Promise<string[]> {
        let items = await this.getAllLive();
        let sids = [];
        for (const item of items) {
            sids.push(item.sessionId);
        }
        return sids;
    }

    async clearExpired() {
        return new Promise((resolve, reject) => {
            sql.query('DELETE FROM ' + this.tableEscaped + ' WHERE expires < ?',
                [
                    Math.round(Date.now() / 1000),
                ],
                (err) => {
                        resolve(undefined);
                });
        });
    }
}

export default new AuthCodeModel(options);
