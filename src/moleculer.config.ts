import Entity from "@bestapps/microservice-entity/dist/entity/Entity";
import List from "@bestapps/microservice-entity/dist/entity/List";

let config = require('config');

let transporterType = config.broker.transporter.type.toLowerCase();
let transporterConfig = config.broker.transporter[transporterType];
let transporter = {
    type: transporterType.charAt(0).toUpperCase() + transporterType.slice(1),
    options: {
        [transporterType]: {
            port: transporterConfig.port,
            host: transporterConfig.host || 'localhost'
        },
        disableOfflineNodeRemoving: config.broker.transporter.disableOfflineNodeRemoving,
        disableHeartbeatChecks: config.broker.transporter.disableHeartbeatChecks,
    },
};

module.exports = {
    nodeID: config.broker.nodeID,
    middlewares: [
        {
            localAction(next, action) {
                return function (ctx) {
                    // Change context properties or something
                    return next(ctx).then((res) => {
                        //console.log('[RES]', res);

                      if(res instanceof List) {
                            let d:any = res.allData;
                            let dItems = [];
                            for(let i = 0; i < res.items.length; i++){
                                dItems.push(res.items[i].allData ? res.items[i].allData : res.items[i]);
                            }
                            d.items = dItems;
                            return d;
                        }

                        if(res instanceof Entity) return res.allData;

                        if(Array.isArray(res)){
                            let data = [];
                            for(let i = 0; i < res.length; i++){
                                data.push(res[i].allData ? res[i].allData : res[i]);
                            }
                            return data;
                        }
                        return res;
                    }).catch(err => {
                        // Handle error or throw further
                        throw err;
                    });
                }
            }
        }
    ],
    transporter: `${transporterType}://${transporterConfig.host || 'localhost'}:${transporterConfig.port}`,
    registry: {
        discoverer: {
	        transporter,
	    }
    }
};
