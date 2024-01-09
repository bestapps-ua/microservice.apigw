import { ServiceBroker } from "moleculer";
let config = require('config');

import appModel from "@bestapps/microservice-entity/dist/model/AppModel";

appModel.init();

// Create broker
const broker = new ServiceBroker();

// Load service
broker.loadServices( "./src/",  "*service.ts");

export default broker;
