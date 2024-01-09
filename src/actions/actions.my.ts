
import NotFoundError from "../entity/error/not.found.error";
import responseModel from "../model/ResponseModel";

let config = require('config');

class MoleculerActionsMy {
    generate(actions) {
        return Object.assign(actions, {

            async getMyProfile(ctx) {
                let user = ctx.meta.user;
                let authCode = ctx.meta.authCode;
                let isSecure = ctx.meta.isSecure;
                return new Promise(async (resolve, reject) => {
                    if (!user) return reject(new NotFoundError('user'));
                    resolve(await responseModel.getMyProfileSecuredResponse(authCode, isSecure, user));
                });
            },
        });
    }
}

export default new MoleculerActionsMy();
