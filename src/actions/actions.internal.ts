
import NotFoundError from "../entity/error/not.found.error";
import userModel from "../model/user/UserModel";
import authModel from "../model/auth/AuthModel";
import ExistError from "../entity/error/exist.error";


let config = require('config');

class MoleculerActionsInternal {
    generate(actions) {
        return Object.assign(actions, {
            async generateUser(ctx) {
                let phone = ctx.params.phone;
                let password = ctx.params.password;
                return new Promise(async (resolve, reject) => {
                    if (!phone) return reject(new NotFoundError('phone'));
                    if (!password || password != config.service.internal.password) return reject(new NotFoundError('password'));
                    let user = await authModel.getUserByPhone(phone);
                    if(user) {
                        return reject(new ExistError('phone'));
                    }
                    let data = await userModel.generateByPhone(phone);
                    return resolve({
                        ok: true,
                        data: {
                            key: data.user.getKey(),
                            password: data.password,
                        },
                    });
                });
            },
        });
    }
}

export default new MoleculerActionsInternal();
