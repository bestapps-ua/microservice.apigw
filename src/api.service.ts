// @ts-ignore

import sql from "./model/SQLModel";
import MoleculerActions from "./actions";

let moleculerActions = new MoleculerActions();

let config = require('config');
import globalEventModel from "@bestapps/microservice-entity/dist/model/event/GlobalEventModel";

import {ServiceSchema} from "moleculer";
import {EVENT_SQL_CONNECTED} from "@bestapps/microservice-entity/dist/model";
import appModel from "./model/AppModel";

const AppService: ServiceSchema | any = {
    name: config.service.name,
    dependencies: config.service.dependencies,
    mixins: moleculerActions.generateMixins(),
    settings: moleculerActions.generateSettings(),
    methods: moleculerActions.generateMethods(),
    actions: moleculerActions.generateActions({}),
    events: {

    },

    created() {
        // Fired when the service instance created (with `broker.loadService` or `broker.createService`)
    },

    async started() {
        return new Promise((resolve, reject) => {
            appModel.setBroker(this.broker);
            sql.connect(function (err) {
                if (err) {
                    console.log('[ERR SQL CONNECTION]', err);
                    return reject();
                }
                globalEventModel.getEmitter().emit(EVENT_SQL_CONNECTED, {});
                console.log('STARTED');
                resolve(undefined);
            });
        });
    },

    async stopped() {

    },
    hooks: {
        before: {
            "*": function (ctx, res) {
                let secureData = ctx.params.secureData;

                return res;
            }
        }
    }
};

export = AppService;
