'use strict';


let EventEmitter = require('events');
let eventEmitter = new EventEmitter();

class GlobalModel {
    eventEmitter: any;
    constructor(){
        this.eventEmitter = eventEmitter;
    }

    getEmitter(){
        return this.eventEmitter;
    }
}

export default new GlobalModel();
