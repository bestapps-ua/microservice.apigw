import broker from './broker';

import configModel from '@bestapps/microservice-entity/dist/model/ConfigModel';
import RegistryModel from '@bestapps/microservice-entity/dist/model/RegistryModel';



let config = require('config');

configModel.setCacheConfig(config.cache);
RegistryModel.set('configModel', configModel);

broker.start();
