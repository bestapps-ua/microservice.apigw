import UserPin from "../../entity/user/UserPin";
import User from "../../entity/user/User";

let config = require('config');

let momentTz = require('moment-timezone');
import { v4 as uuidv4 } from 'uuid';

const TYPE_PHONE = 'phone';
const TYPE_EMAIL = 'email';

const STATUS_NEW = 'new';
const STATUS_FINISHED = 'finished';

class UserPinModel {
    protected _table: string = 'user_pin';
    protected _entity: any = UserPin;

    make(data, callback) {
        let p = [];
        super.make(data, (err, itemData) => {
            itemData = Object.assign(itemData, {
                user: undefined,
                credential: data.credential,
                status: data.status,
                type: data.type,
                pin: data.pin,
                token: data.token,
            });
            let p = [];

            return new Promise((resolve, reject) => {
                Promise.all(p).then(() => {
                    callback && callback(undefined, itemData);
                }).catch((err) => {
                    console.log('[err make]', err);
                    callback && callback(err);
                });
            });
        });
    }

    create(userPin: UserPin, callback) {
        sql.insertQuery('INSERT INTO `' + this.table + '` ' +
            '(user_id, credential, `type`, `status`, pin, token, created) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                userPin.user ? userPin.user.id : null,
                userPin.credential,
                userPin.type,
                STATUS_NEW,
                userPin.pin,
                userPin.token,
                momentTz().unix(),
            ],
            (err, id) => {
                if (err || !id) return callback && callback(err);
                this.get(id, async (err, userPin: UserPin) => {
                    callback && callback(err, userPin);
                });
            });
    }

    setStatus(user, userPin: UserPin, status, callback) {
        sql.query('UPDATE `' + this.table + '` SET `user_id` = ?, `status` = ? WHERE id = ? LIMIT 1',
            [
                user.id,
                status,
                userPin.id
            ],
            (err) => {
                this.get(userPin.id, callback);
            });
    }

    setFinished(user, userPin, callback){
        this.setStatus(user, userPin, STATUS_FINISHED, callback);
    }

    generatePin() {
        let min = 0;
        let max = 999999;
        let pin: any = Math.floor(Math.random() * (max - min)) + min;
        ///pin = 0;
        pin = `${pin}`;
        while(pin.length < 6){
            pin = '0'+pin;
        }
        return pin;
    }

    async sendPhonePin(phone: string) {
        let data = {
            pin: this.generatePin(),
            token: this.generateToken(),
            credential: phone,
            type: TYPE_PHONE,
        };
        return new Promise((resolve, reject) => {
            this.create(new UserPin(data), async (err, userPin: UserPin) => {
                if (err) return reject(err);
                if (!userPin) return reject('no pin');
                if (config.SMS.LIVE === false) {
                    if (config.SMS.MSISDNS_ALLOWED.indexOf(phone) !== -1) {
                        await smsModel.sendPin(phone, userPin.pin);
                    }
                } else {
                    await smsModel.sendPin(phone, userPin.pin);
                }
                resolve(userPin);
            });
        });
    }

    async sendEmailPin(user: User, email: string) {
        let appToken = this.generateToken();
        let data = {
            user,
            pin: this.generatePin(),
            token: appToken,
            credential: email,
            type: TYPE_EMAIL,
        };
        return new Promise((resolve, reject) => {
            this.create(new UserPin(data), async (err, userPin: UserPin) => {
                if (err) return reject(err);
                if (!userPin) return reject('no pin');
                let data: any = {
                    to: email,
                };
                await emailModel.sendConfirmPin(data, userPin);
                resolve(userPin);
            });
        });
    }

    async getEmailPin(email: string) {
        let data = {
            pin: this.generatePin(),
            token: this.generateToken(),
            credential: email,
            type: TYPE_EMAIL,
        };
        return new Promise((resolve, reject) => {
            this.create(new UserPin(data), async (err, userPin: UserPin) => {
                if (err) return reject(err);
                if (!userPin) return reject('no pin');
                resolve(userPin);
            });
        });
    }



    /**
     *
     * @param credential
     * @param code
     * @param token
     * @returns any
     */
    async validatePin(credential: string, code: string, token: string) {
        let userPin: any = await new Promise((resolve, reject) => {
            this.getLastByCredential(credential, (err, userPin) => {
                resolve(userPin);
            });
        });
        if (!userPin) return {pin: userPin, status: 'credential wrong'};
        if (userPin.token !== token) return {pin: userPin, status: 'token wrong'};
        if (userPin.status !== STATUS_NEW) return {pin: userPin, status: 'status wrong'};
        if (config.PIN.LIVE === false && code === config.PIN.BACKDOOR) return {pin: userPin, status: true};
        if (userPin.pin === code) return {pin: userPin, status: true};
        return {pin: userPin, status: 'pin wrong'};
    }

    generateToken() {
        let uid = uuidv4();
        return uid;
    }

    getLastByCredential(credential, callback){
        sql.getOne(`SELECT * FROM ${this.table} WHERE credential = ? ORDER BY id DESC LIMIT 1`, [credential], (err, row) => {
            if(!row) return callback && callback(err);
            this.get(row.id, callback);
        });
    }

}

export default new UserPinModel();
