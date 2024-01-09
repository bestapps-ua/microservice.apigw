'use strict';
import RegistryModel from '@bestapps/microservice-entity/dist/model/RegistryModel';
let config = require('config');

let sql = RegistryModel.get('sql');
if (!sql) {
    /**
     * type {Wap3LibSQL}
     */
    let Wap3LibSQL = require('@bestapps/raks-sql').Wap3LibSQL;

    sql = new Wap3LibSQL({
        showLog: false,
        db: {
            host: config.db.host,
            user: config.db.user,
            password: config.db.password,
            database: config.db.name
        }
    });
    RegistryModel.set('sql', sql);
}
export default sql;
