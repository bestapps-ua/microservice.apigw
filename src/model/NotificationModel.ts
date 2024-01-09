import globalModel from "./GlobalModel";
import {EVENT_MESSAGES_MATCHED} from "./EventTypeModel";
import socketModel from "./SocketModel";
import authCodeModel from "./auth/AuthCodeModel";

class NotificationModel {
    constructor() {

    }

    init() {
        globalModel.getEmitter().on(EVENT_MESSAGES_MATCHED, () => {
            this.sendNewMessages();
        });
    }

    async sendNewMessages() {
        let sessions = await authCodeModel.getAllLiveSids();
        socketModel.sendNotifications(sessions, 'messagesNew', {});
    }
}

export default new NotificationModel();
