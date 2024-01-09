import UserSession from "../entity/user/UserSession";

let config = require('config');
import appModel from './AppModel';
class SocketModel {

    sendNotifications(sessions: string[], action: string, data: any) {
        let event = action;
        appModel.broker.call(`${config.service.socket.name}.broadcast`, {
            event,
            args: [],
        });
    }
}

export default new SocketModel();
