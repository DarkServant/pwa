import {DataReader} from "./datareader.js"

class ListReader {
    constructor(path) {
        this.lstPath = path;
    }

    
    async LoadLst() {
        return new Promise((resolve) => {
            let vm = this;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', vm.lstPath, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = async function(e) {
                let buffer = new Uint8Array(this.response);
                var result = await vm.ParseListFile({ buffer: buffer, currPos: 0 });

                resolve(result);
                return result;
            };

            xhr.send();
        });
    }

    async ParseListFile(buffer) {
        return new Promise(async (resolve) => { // eslint-disable-line
            let lstDictionary = [];

            //let buffer = await LoadLst(this.lstPath);
            let dataReader = new DataReader(buffer);

            let headerLength = dataReader.readByte();
            let headerText = dataReader.readFixedString(headerLength);

            let versionLength = dataReader.readByte();
            let versionText = dataReader.readFixedString(versionLength);

            let unk1 = dataReader.readUInt32();
            let total = dataReader.readUInt32();

            for (let i = 0; i < total; i++) {
                let lst = new LST();
                let fileNameLength = dataReader.readByte();
                lst.fileName = dataReader.readFixedString(fileNameLength);

                lst.tileNum = dataReader.readUInt32();
                lst.fileNum = dataReader.readUInt32();


                if (this.lstPath.indexOf("snd.lst") > -1) {
                    fileNameLength = dataReader.readByte(); //new
                    lst.nameNew = dataReader.readFixedString(fileNameLength); //new                
                }

                lst.index = dataReader.readUInt32();

                if (versionText === "1.2" || this.lstPath.indexOf("snd.lst") > -1) {
                    lst.unkNew = dataReader.readUInt32();
                }

                lstDictionary[lst.tileNum] = lst;
            }
            resolve(lstDictionary);
        });
    }
}

class LST {
    constructor() {
        this.fileName = "";
        this.tileNum = 0;
        this.fileNum = 0;
        this.index = 0;
        this.initialized = false;
        this.data = undefined;
        this.dimensions = undefined;
        this.loaded = {};
    }

    isIndexLoaded(){
        return this.loaded[this.index];
    }
}

export {ListReader, LST};