class AppModel
{
    public models: {};
    public broker: any;

    filesDirectory: string;

    constructor() {
        this.models = {};
        this.filesDirectory = __dirname + `/../../data/files`;
    }

    public setBroker(broker) {
        this.broker = broker;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFilesDirectory() {
        return this.filesDirectory;
    }

}

export default new AppModel();
