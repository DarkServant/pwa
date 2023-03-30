import {ListReader} from "./listReader.js"
import { RLEReader } from "./rleReader.js";
import {RMDReader} from "./rmdReader.js"

class AssetManager {
    constructor() {

    }

    static virtualTileDictionary; // rmd.TileNumber_rmd.srcX_rmd.srcY.. maps to virtualTileNumber
    static reverseVirtualTileDictionary =[]; // virtualTileNumber maps to rmd.TileNumber_rmd.srcX_rmd.srcY.
    static tileDataToVirtualTile;
    static tileData = [];
    static virtualTileToTileData = [];

    static reverseVirtualObjectDictionary;
    static virtualObjectDictionary=[];
    static objectDataToVirtualObject;
    static objectData =[];
    static characterData=[];
    static icoData =[];
    static bulRMDData=[];

    static rmdData = [];
    static bulRMDData =[];
    static icoRMDData =[];
    static characterRMDData = [];
    static objectRMDData =[];

    static tileListDictionary =[];
    static objectListDictionary;
    static characterListDictionary;
    static icoListDictionary;
    static intListDictionary;
    static sndListDictionary;

    static requiredTileNames =[];
    static tleFiles = {};

    static relativePaths;
    static async init(relativePath = "./data/RLEs/") {
        //let vm = this;
        AssetManager.relativePaths = relativePath;
        AssetManager.virtualTileDictionary = {};
        AssetManager.tileDataToVirtualTile = {};
        AssetManager.reverseVirtualTileDictionary=[];
        AssetManager.virtualTileToTileData = [];

        AssetManager.virtualObjectDictionary = {};
        AssetManager.objectDataToVirtualObject = {};
        AssetManager.reverseVirtualObjectDictionary = [];

        return new Promise(async (resolve) => { // eslint-disable-line 
            console.log("Loading lst files.");
            AssetManager.tleFiles = {};
            AssetManager.requiredTileNames =[];

            let tileListReader = new ListReader(relativePath + 'tle.lst');
            AssetManager.tileListDictionary = await tileListReader.LoadLst();

            let objectListReader = new ListReader(relativePath + 'obj.lst');
            AssetManager.objectListDictionary = await objectListReader.LoadLst();

            AssetManager.characterListDictionary = [];

            for (let i = 0; i < 10; i++) {
                let characterListReader = new ListReader(relativePath + 'Chr/c0' + i + '.lst');
                AssetManager.characterListDictionary[i] = await characterListReader.LoadLst();
            }

            let characterListReader = new ListReader(relativePath + 'Chr/etc.lst');
            AssetManager.characterListDictionary[10] = await characterListReader.LoadLst();

            let icoListReader = new ListReader(relativePath + 'ico.lst');
            AssetManager.icoListDictionary = await icoListReader.LoadLst();

            let intListReader = new ListReader(relativePath + 'int.lst');
            AssetManager.intListDictionary = await intListReader.LoadLst();

            let bulListReader = new ListReader(relativePath + 'bul.lst');
            AssetManager.bulListDictionary = await bulListReader.LoadLst();

            let sndListReader = new ListReader(relativePath + 'snd.lst');
            AssetManager.sndListDictionary = await sndListReader.LoadLst();

            console.log("lst files loaded.");

            resolve();
        });
    }

    static paddy(n, p, c = '0') {
        return ('' + n).padStart(p, c)
    }

    static splitArrayIntoChunks(array, chunk = 40) {
        let ret = [];

        for (let i = 0; i < array.length; i += size) {
            let temparray = array.slice(i, i + chunk);
            ret.push(temparray);
        }

        return ret;
    }

    static async getTile(pRmdNumber, pRmdIndex, cb) {

        return new Promise(async (resolve) => { // eslint-disable-line 
            //check if the rmd object has been loaded into tileData first.
            if (!AssetManager.tileData[pRmdNumber + '_' + pRmdIndex]) { // ${rmdObj.rmdNum}_${z}
                let tileReader = new RMDReader();

                tileReader.init(`../Redmoon/DATAs/Tle/tle${AssetManager.paddy(pRmdNumber, 5)}.rmd`, 0); 
                await tileReader.loadRMD(); // returns values back to rmdList below
            }

            // we may just want to return here
            // we only need to do the rest when we actually want to read bytes from the
            // RLE texture... which shouldn't be until we start blitting things.
            let rmdList = AssetManager.tileData[pRmdNumber + '_' + pRmdIndex],
                rmd,
                tileLST,
                rleReader;

            if (!rmdList) {
                console.log(`Tile data has not been initialized. pRmdNumber: ${pRmdNumber} pRmdIndex: ${pRmdIndex}`);
                resolve();
                return;
            }

            if (rmdList.count === 0) {
                console.log("No RMD Data found.");
            }
            rmd = rmdList[0];
            //console.log(rmd);
            tileLST = AssetManager.tileListDictionary[rmd.tileNumber];
            //console.log(tileLST);
            //console.log(`LST  initialized ${rmd.tileNumber} ${pRmdNumber} ${pRmdIndex}`);

            if (!tileLST) console.log(`Unable to find tle ${rmd.tileNumber} in list file.`);

            if (!tileLST.initialized) {
                //MG 1/21/2016 - Only load the tle file if it hasn't been cached.
                //if (!AssetManager.tleFiles['tile' + AssetManager.paddy(tileLST.fileNum, 5)]) {
                //    if (!(AssetManager.requiredTileNames.indexOf(`tle${AssetManager.paddy(tileLST.fileNum, 5)}-${tileLST.index}`) > - 1)) {
                //        AssetManager.requiredTileNames.push(`tle${AssetManager.paddy(tileLST.fileNum, 5)}-${tileLST.index}`);
                //    }
                    var rlePath  = AssetManager.relativePaths + "tle/" + `tle${AssetManager.paddy(tileLST.fileNum, 5)}.rle`;
                    rleReader = new RLEReader(rlePath);
                    await rleReader.readRle(rlePath);
                    console.log("LST  initialized header " + rmd.tileNumber);
            }
            
            if(!tileLST.isIndexLoaded()){
                console.log("LST  initialized load data rmd.tileNumber: " + rmd.tileNumber + " lst FileNumber " + tileLST.fileNum + " lst Index " + tileLST.index);
                rleReader.initializeLST(tileLST);
            } 
            resolve();
        });
    }

    static async getObject(rmdFileNumber, pTileIndex, cb) {
        return new Promise(async (resolve) => { // eslint-disable-line 
            //check if the rmd object has been loaded into objectData first.
            if (!AssetManager.objectData[rmdFileNumber + '_' + pTileIndex]) {
                //RMC is missing some rmds on the map
                if (rmdFileNumber === 154 || rmdFileNumber === 76 || rmdFileNumber === 82 || rmdFileNumber === 80 || rmdFileNumber === 78) { //object used by map 41 that does not exist in RMC rmds
                    resolve();
                    return;
                }

                let tileReader = new RMDReader();

                tileReader.init(`../Redmoon/DATAs/Obj/obj${AssetManager.paddy(rmdFileNumber, 5)}.rmd`, 1);
                await tileReader.loadRMD();
            }


            let rmdRow = AssetManager.objectRMDData[rmdFileNumber];

            if (rmdRow && rmdRow.animations && rmdRow.animations.length === 0) {
                //if the rmdRow has no animations then just load the single rmdList based on the requested tileindex
                rmdRow = { "rmdList": [AssetManager.objectData[rmdFileNumber + '_' + pTileIndex]] };
            }

            if (rmdRow && rmdRow.rmdList) {
                for (let i = 0; i < rmdRow.rmdList.length; i++) {
                    let rmdList = rmdRow.rmdList[i];
                    let rmd,
                        objLST,
                        rleReader;

                    if (!rmdList) {
                        console.log(`Object data has not been initialized. rmdFileNumber: ${rmdFileNumber}  pTileIndex: ${pTileIndex}`);
                        resolve();
                        return;
                    }

                    if (rmdList.count === 0) {
                        console.log("No RMD Data found.");
                    }

                    for (let z = 0; z < rmdList.length; z++) {
                        rmd = rmdList[z];
                        objLST = AssetManager.objectListDictionary[rmd.tileNumber];

                        if (!objLST) console.log(`Unable to find obj ${rmd.tileNumber} in list file.`);

                        if (!objLST.initialized) {
                            //MG 1/21/2016 - Only load the tle file if it hasn't been cached.
                            //if (!this.objFiles[AssetManager.paddy(objLST.fileNum, 5)]) {
                            //    if (!(this.requiredObjNames.indexOf(`obj${AssetManager.paddy(objLST.fileNum, 5)}-${objLST.index}`) > - 1)) {
                            //        this.requiredObjNames.push(`obj${AssetManager.paddy(objLST.fileNum, 5)}-${objLST.index}`);
                            //    }
                            //}
                            //objLST.initialized = true;

                            var rlePath  = AssetManager.relativePaths + "Obj/" + `obj${AssetManager.paddy(objLST.fileNum, 5)}.rle`;
                            rleReader = new RLEReader(rlePath);
                            await rleReader.readRle(rlePath);
                            //console.log("LST  initialized header " + rmd.tileNumber);
                        }
                        if(!objLST.isIndexLoaded()){
                            console.log("LST  initialized load data rmd.tileNumber: " + rmd.tileNumber + " lst FileNumber " + objLST.fileNum + " lst Index " + objLST.index);
                            if(!rleReader){
                                var rlePath  = AssetManager.relativePaths + "Obj/" + `obj${AssetManager.paddy(objLST.fileNum, 5)}.rle`;
                                rleReader = new RLEReader(rlePath);
                                await rleReader.readRle(rlePath);
                            }
                            rleReader.initializeLST(objLST);
                        } 
                    }
                }
            } else {
                console.log("No rmdRow data found.");
            }
            resolve();
        });
    }

    static async getCharacter(characterNum, etc) {
        let vm = this;

        return new Promise(async (resolve) => { // eslint-disable-line 
            let rmdFileNumber = dataParser.characterRMDData[characterNum].rmdNum
            let rmdRow = vm.characterRMDData[rmdFileNumber];

            if (etc) charListNum = 10;

            if (rmdRow && rmdRow.rmdList) {
                for (let i = 0; i < rmdRow.rmdList.length; i++) {
                    let rmdList = rmdRow.rmdList[i];
                    let rmd,
                        chrLST;

                    if (!rmdList) {
                        console.log(`Tile data has not been initialized. rmdFileNumber: ${rmdFileNumber}`);
                        resolve();
                        return;
                    }

                    if (rmdList.count === 0) {
                        console.log("No RMD Data found.");
                    }

                    for (let i = 0; i < rmdList.length; i++) {
                        rmd = rmdList[i];
                        if (typeof rmd.tileNumber === "number") {
                            chrLST = vm.characterListDictionary[charListNum][rmd.tileNumber];
                            await this.loadChrLST(chrLST, characterNum);
                        }

                    }
                }
                resolve();
            } else {
                console.log("No rmdRow data found.");
                resolve();
            }

        });
    }

    static async loadWeapon(characterNum, weaponIndex, etc) {
        let vm = this;

        return new Promise(async (resolve) => { // eslint-disable-line 
            let rmdFileNumber = dataParser.characterRMDData[characterNum].rmdNum
            let rmdRow = vm.characterRMDData[rmdFileNumber];
            let charListNum = (characterNum > 9 ? 10 : characterNum);

            if (etc) charListNum = 10;

            if (rmdRow && rmdRow.rmdList) {
                for (let i = 0; i < rmdRow.rmdList.length; i++) {
                    let rmdList = rmdRow.rmdList[i];
                    let rmd,
                        chrLST;

                    if (!rmdList) {
                        console.log(`Tile data has not been initialized. rmdFileNumber: ${rmdFileNumber}`);
                        resolve();
                        return;
                    }

                    if (rmdList.count === 0) {
                        console.log("No RMD Data found.");
                    }

                    for (let i = 0; i < rmdList.length; i++) {
                        rmd = rmdList[i];
                        if (typeof rmd.tileNumber !== "number") {
                            chrLST = vm.characterListDictionary[charListNum][rmd.tileNumber[weaponIndex]];
                            await this.loadChrLST(chrLST, characterNum, etc);
                        }

                    }
                }
            } else {
                console.log("No rmdRow data found.");
            }
            resolve();

        });
    }

    static async loadChrLST(chrLST, characterNum, etc) {
        if (!chrLST) {
            console.log(`Unable to find character ${characterNum} in list file.`);
        }

        let rleReader;

        if (chrLST && !chrLST.initialized) {
            chrLST.initialized = true;	//todo: move this after into getraw
            if (characterNum > 9 || etc) {
                if (!this.objFiles[`etc${AssetManager.paddy(chrLST.fileNum, 5)}`]) {
                    rleReader = newRLEReader(`./data/RLEs/Chr/Etc/etc${AssetManager.paddy(chrLST.fileNum, 5)}}.rle`);

                    let dataReader = await rleReader.load();
                    this.objFiles[`etc${AssetManager.paddy(chrLST.fileNum, 5)}`] = dataReader;

                    rleReader.readHeader();
                    rleReader.initializeLST(chrLST);
                } else {
                    rleReader = newRLEReader(`./data/RLEs/Chr/Etc/etc${AssetManager.paddy(chrLST.fileNum, 5)}.rle`);

                    rleReader.dataReader = this.objFiles[`etc${AssetManager.paddy(chrLST.fileNum, 5)}`];
                    rleReader.dataReader.currPos = -1;
                    rleReader.readHeader();
                    rleReader.initializeLST(chrLST);
                }
            } else {
                let num2 = AssetManager.paddy(characterNum, 2);
                rleReader = newRLEReader(`./data/PNGRLEs/Chr/C${num2}/c${num2}${AssetManager.paddy(chrLST.fileNum, 5)}-${chrLST.index}.png`);
                await rleReader.loadPNGImage(chrLST);
            }
        }
    }

}

export {AssetManager}