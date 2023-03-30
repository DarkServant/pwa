import {DataReader} from "./datareader.js"
import {AssetManager} from "./assetManager.js"

class RMDReader {
    constructor() {
        this.tilePath = 0;
        this.rmdType = 0;
    }

    init(pTilePath, pRMDType) {
        //console.log(pTilePath);
        this.tilePath = pTilePath;
        this.rmdType = pRMDType;
    }

    async loadRMD() {
        

        return new Promise((resolve) => {
            let vm = this;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', vm.tilePath, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = async function(e) {
                let buffer = new Uint8Array(this.response);
                await vm.readRMD({ buffer: buffer, currPos: 0 });

                resolve();
            };

            xhr.send();
        });
    }


    async readRMD(buffer) {
        let vm = this;
        var dr;

        try {
            return new Promise((resolve) => {
                (async () => {
                    dr = new DataReader(buffer);

                    let rmdObj = {
                        headerLength: undefined,
                        headerText: undefined,
                        rmdNum: undefined,
                        unk1: undefined,
                        unk2: undefined,
                        nameLength: undefined,
                        name: undefined,
                        unk6: undefined,
                        count: undefined,
                        rmdList: [],
                        animationCount: undefined,
                        animations: {},
                        currentFrameIndex: 0,
                        animationParts: undefined,
                        animationRows: undefined,
                        getAnimationRMDList: (index) => {
                            return index + (rmdObj.animationRows * rmdObj.animations[0][rmdObj.currentFrameIndex]);
                        },
                        nextFrame: () => {
                            rmdObj.currentFrameIndex++;
                            if (rmdObj.currentFrameIndex > rmdObj.animations[0].length - 1) {
                                rmdObj.currentFrameIndex = 0;
                            }
                        }
                    };

                    rmdObj.headerLength = dr.readByte();
                    //buffer.currPos += headerLength;	//skip header length position;
                    rmdObj.headerText = dr.readFixedString(rmdObj.headerLength);

                    rmdObj.rmdNum = dr.readUInt32();
                    rmdObj.unk1 = dr.readUInt32();
                    rmdObj.unk2 = dr.readUInt32();
                    rmdObj.nameLength = dr.readByte();
                    rmdObj.name = dr.readFixedString( rmdObj.nameLength);
                    rmdObj.animationParts = dr.readUInt32();
                    rmdObj.animationRows = dr.readUInt32();
                    rmdObj.unk6 = dr.readByte();
                    rmdObj.count = dr.readUInt32();


                    //Unk 4 and 5 seem to sometime have values, unk5 is USUALLY the same as count and unk4 is usually 1? 
                    //if(vm.tilePath.indexOf('146') > -1) rmdObj.count ++; //146 has 69 items?

                    //console.log("rmd count: " + rmdObj.count);
                    for (let z = 0; z < rmdObj.count; z++) {
                        let count2;
                        count2 = dr.readUInt32();

                        let rmdList = [];

                        for (let j = 0; j < count2; j++) {
                            let rmd = new RMDImage();

                            for (let i = 0; i < 11; i++) {
                                let value;
                                value = dr.readUInt32();

                                switch (i) {
                                    case 0: //X Start
                                        rmd.sourceX = value;
                                        break;
                                    case 1: //Y Start
                                        rmd.sourceY = value;
                                        break;
                                    case 2: //X End
                                        rmd.sourceEndX = value;
                                        break;
                                    case 3: //Y End
                                        rmd.sourceEndY = value;
                                        break;
                                    case 4:
                                        rmd.unk1 = value;
                                        break;
                                    case 5:
                                        rmd.zorder = value;
                                        break;
                                    case 6:
                                        rmd.destX = value;
                                        break;
                                    case 7:
                                        rmd.destY = value;
                                        break;
                                    case 8:
                                        rmd.unk5 = value; //drawtype > 0 = needs opacity or lighten
                                        break;
                                    case 9:
                                        rmd.unk6 = value;
                                        break;
                                    case 10: {
                                        rmd.imgidcount = value;

                                        let imgidcount = value;
                                        let tileNumbers = [];

                                        for (let b = 0; b < imgidcount; b++) {
                                            let imgTileNumber = dr.readUInt32();

                                            tileNumbers.push(imgTileNumber);
                                        }

                                        rmd.tileNumber = tileNumbers.length === 1
                                            ? tileNumbers[0]
                                            : tileNumbers;
                                        break;
                                    }
                                    default:
                                        console.log(`Element ${i} exists.`);
                                        break;
                                }
                            }
                            if(rmd.sourceEndX - rmd.sourceX <= 0 ||rmd.sourceEndY - rmd.sourceY <= 0)
                            continue;

                            rmdList.push(rmd);
                        }
                        if(rmdList.length ==0)
                            continue;

                        switch (vm.rmdType) {
                            case 0: //RMDType.Tile
                                AssetManager.tileData[`${rmdObj.rmdNum}_${z}`] = rmdList;
                                if(rmdList.length > 1){console.log ("fkfkfkf" + rmdList.length);}
                                var rmd = rmdList[0];
                                console.log("affaf" + rmd.tileNumber);
                                var virtTileId = AssetManager.reverseVirtualTileDictionary.length;
                                if(AssetManager.virtualTileDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`] == undefined){
                                    AssetManager.virtualTileDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`] = virtTileId;
                                    AssetManager.reverseVirtualTileDictionary.push(`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`);
                                    if(AssetManager.tileDataToVirtualTile[`${rmdObj.rmdNum}_${z}`] != undefined){
                                        console.log(`collisions ${rmdObj.rmdNum}_${z}`);
                                    }
                                    AssetManager.tileDataToVirtualTile[`${rmdObj.rmdNum}_${z}`] = virtTileId;
                                    AssetManager.virtualTileToTileData.push({tileFileNumber: rmdObj.rmdNum, tileIndexNumber: z});
                                }else {
                                    console.log(`duplicate: ${rmdObj.rmdNum}_${z} ${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`);
                                    AssetManager.tileDataToVirtualTile[`${rmdObj.rmdNum}_${z}`]  = AssetManager.virtualTileDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`];
                                }
                                break;
                            case 1: //RMDType.Object                     
                                AssetManager.objectData[`${rmdObj.rmdNum}_${z}`] = rmdList;
                                rmdObj.rmdList[z] = rmdList;
                                var rmd = rmdList[0];
                                var virtTileId = AssetManager.reverseVirtualObjectDictionary.length;
                                if(AssetManager.virtualObjectDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`] == undefined){
                                    AssetManager.virtualObjectDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`] = virtTileId;
                                    AssetManager.reverseVirtualObjectDictionary.push(`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`);
                                    if(AssetManager.objectDataToVirtualObject[`${rmdObj.rmdNum}_${z}`] != undefined){
                                        console.log(`collisions ${rmdObj.rmdNum}_${z}`);
                                    }
                                    AssetManager.objectDataToVirtualObject[`${rmdObj.rmdNum}_${z}`] = virtTileId;
                                }else {
                                    console.log(`duplicate: ${rmdObj.rmdNum}_${z} ${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`);
                                    AssetManager.objectDataToVirtualObject[`${rmdObj.rmdNum}_${z}`]  = AssetManager.virtualObjectDictionary[`${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`];
                                }

                                break;
                            case 2: //RMDType.Character
                                AssetManager.characterData[`${rmdObj.rmdNum}_${z}`] = rmdList;
                                rmdObj.rmdList[z] = rmdList;
                                break;
                            case 3: //RMDType.Ico
                                AssetManager.icoData[`${rmdObj.rmdNum}_${z}`] = rmdList;
                                rmdObj.rmdList[z] = rmdList;
                                break;
                            case 4: //RMDType.Bul
                                AssetManager.bulRMDData[`${rmdObj.rmdNum}_${z}`] = rmdList;
                                rmdObj.rmdList[z] = rmdList;
                                break;

                            default:
                                console.log(`Unknown rmdType: ${vm.rmdType}`);
                                break;
                        }

                    }	//end of main for loop

                    rmdObj.animationCount = dr.readUInt32(); //animation count

                    for (let i = 0; i < rmdObj.animationCount; i++) {
                        let animationFrameCount = dr.readUInt32();

                        for (let z = 0; z < animationFrameCount; z++) {
                            rmdObj.animations[i] = rmdObj.animations[i] || [];
                            rmdObj.animations[i].push(dr.readUInt16());
                        }
                    }

                    switch (vm.rmdType) {
                        case 0: //RMDType.Tile
                            AssetManager.rmdData[rmdObj.rmdNum] = rmdObj;
                            break;
                        case 1: //RMDType.Object 
                            AssetManager.objectRMDData[rmdObj.rmdNum] = rmdObj;
                            break;
                        case 2: //RMDType.Character
                            AssetManager.characterRMDData[rmdObj.rmdNum] = rmdObj;
                            break;
                        case 3: //RMDType.Ico
                            AssetManager.icoRMDData[rmdObj.rmdNum] = rmdObj;
                            break;
                        case 4: //RMDType.Bul
                            AssetManager.bulRMDData[rmdObj.rmdNum] = rmdObj;
                            break;
                        default:
                            console.log(`Unknown rmdType: ${vm.rmdType}`);
                            break;

                    }
                    console.log("fml " + buffer.buffer.length + " " +buffer.currPos + " " + this.tilePath);
                    resolve(vm.tilePath);

                })();
            });

        } catch (error) {
            console.log(`loadRMD Error: ${error}`);
            resolve();
        }
    }
}

class RMDImage {
    constructor() {
        this.sourceX = 0;
        this.sourceY = 0;
        this.sourceEndX = 0;
        this.sourceEndY = 0;
        this.tileNumber = undefined; //<--will either be a value or an array of values
        this.unk1 = 0;
        this.zorder = 0;
        this.destX = 0;
        this.destY = 0;
        this.unk5 = 0;
        this.unk6 = 0;
        this.animationCount = 0;
        this.animations = [];
    }

    get width() {
        return (this.sourceEndX - this.sourceX);
    }

    get height() {
        return (this.sourceEndY - this.sourceY);
    }
}

export {RMDReader, RMDImage};