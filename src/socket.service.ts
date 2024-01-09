import socketModel from "./model/SocketModel";
import {ServiceSchema} from "moleculer";

const SocketIOService = require("moleculer-io")
const config = require("config");

import notificationModel from "./model/NotificationModel";

const SocketService: ServiceSchema | any = {
    name: config.service.socket.name,
    mixins: [SocketIOService],
    settings: {
        port: config.service.socket.port,
        options: {
            //	Socket.io options
        }
    },

    methods: {

    },
    created() {
        notificationModel.init();
    },

};

export = SocketService;
