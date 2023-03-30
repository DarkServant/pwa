import {DataReader} from "./datareader.js"
import {AssetManager} from "./assetManager.js"

class RMM {
    constructor() {
        this.object1 = undefined;
        this.object2 = undefined;
        this.tile1 = undefined;
        this.tile2 = undefined;
        this.cursor1 = undefined; 
        this.unk1 = undefined;
        this.collision = undefined;
        this.unk3 = undefined;
    }

    tileFileNumber() {
        return ((parseInt(this.tile2) * 2) + parseInt(this.tile1 / 128));
    }

    tileIndexNumber() {
        return ((parseInt(this.tile1) % 128) * 8) + Math.floor((parseInt(this.object2) / 32));
    }

    objectFileNumber() {
        let fnum = parseInt((parseInt(this.object1) / 4));
        fnum += parseInt((parseInt(this.object2) % 32)) * 64;
        return fnum;
    }

    objectIndexNumber() {
        let inum = this.collision % 24 === 0
            ? (this.unk3 << 1)
            : (this.unk3 << 1) + 1;
        return inum;
    }
}

class MapReader {
    constructor() {
        this.changeMap();
        this.lastMapPosition = {};
        this.mapPath ="";
    }

    setOffsets() {
        mPosition.offsetX = 0;
        mPosition.offsetY = 24;
    }

    async changeMap(mapPath) {
        this.mapPath =mapPath;
        this.headerLength = 0;
        this.tilesAcross = 0;
        this.tilesDown = 0;
        this.unkLength = 0;
        this.unk1 = [];
        this.mapId = 0;
        this.unk2 = 0;
        this.unk3 = [];
        this.tileLayer = [];	/*idnexed by: w + (h * vm.tilesAcross), returns tileId: currentTileColumn + (vm.tilesPerRow * currentTileRow)*/
        this.objectLayer = [];
        this.tileTextureLookup = []; //indexed by: `${tileFileNumber}_${tileIndexNumber}`, returns "tileid": currentTileColumn + (vm.tilesPerRow * currentTileRow)
        this.objectTextureLookup = [];
        this.tilesPerRow = 0;
        this.objectsPerRow = 0;
        this.mapData = []; // indexed by: `${w}_${h}`, returns RMM block
        this.mapDimensions = {};
        this.tileSize = {};
        this.objectSize = {};
        this.tileTexture = {};
        this.reverseTileInfo = []; // given tileId via  currentTileColumn + (vm.tilesPerRow * currentTileRow) in tileTextureLookup, returns tileFileNumber, tileIndexNumber
        this.reverseObjectInfo = [];
    }

    async readMap(mapPath) {
        this.mapPath =mapPath;
        this.lastMapPosition = { x: undefined, y: undefined };

        this.changeMap(mapPath);

        return new Promise((resolve) => {
            let vm = this;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', mapPath, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = async function(e) {
                let buffer = new Uint8Array(this.response);
                await vm.readData({ buffer: buffer, currPos: 0 });

                resolve();
            };

            xhr.send();
        });
    }

    async readData(buffer) {
        return new Promise(async (resolve) => { // eslint-disable-line
            
            var dr = new DataReader(buffer);
            let vm = this;
            vm.headerLength = dr.readByte();
            //console.log(`map header length ${vm.headerLength}`);
            //console.log(`dr cursor ${dr.data.currPos}`);

            let mapHeader = dr.readFixedString( vm.headerLength);
            if (mapHeader !== "RedMoon MapData 1.0") {
                console.log(`Invalid Map Header ${mapHeader}`);
                //console.log(buffer);
            }

            vm.tilesAcross = dr.readUInt32();
            vm.tilesDown = dr.readUInt32();
            vm.unkLength = dr.readByte();
            vm.unk1 = dr.readFixedString( vm.unkLength);
            console.log(vm.unk1);

            vm.mapId = dr.readUInt32();
            let eventLength = dr.readUInt32();

            vm.events = [];

            for (let i = 0; i < eventLength; i++) {
                let eventItem = {};
                eventItem.eventId = dr.readUInt16();
                eventItem.x1 = dr.readUInt32();
                eventItem.y1 = dr.readUInt32();
                eventItem.x2 = dr.readUInt32();
                eventItem.y2 = dr.readUInt32();

                if (eventItem.eventId > 0) vm.events.push(eventItem);
            }

            console.log(`mapId: ${vm.mapId}`);
            console.log(`map dimensions: ${vm.tilesAcross}x${vm.tilesDown}`);

            vm.mapDimensions = { x: vm.tilesAcross, y: vm.tilesDown };

            vm.scrollable = (vm.mapDimensions.x === 18 && (vm.mapDimensions.y === 25 || vm.mapDimensions.y === 26)) ? false : true;

            if (!vm.scrollable) {
                vm.nonScrollableOffSetX = -48;
                vm.nonScrollableOffSetY = -24;
                vm.nonScrollableTileOffSetX = 0;
                vm.nonScrollableTileOffSetY = 0;

                vm.displayX = 16;
                vm.displayY = 25;
            } else {
                vm.nonScrollableOffSetX = 0;
                vm.nonScrollableOffSetY = 0;
                vm.nonScrollableTileOffSetX = 0;
                vm.nonScrollableTileOffSetY = 0;
                vm.displayX = 19;
                vm.displayY = 28;
            }

            vm.tilesPerRow = 85;
            vm.objectsPerRow = 42;

            vm.tileSize = { x: 48, y: 24 };
            vm.objectSize = { x: 96, y: 48 };

            let currentTileColumn = 0;
            let currentTileRow = 0;
            let currentObjectColumn = 0;
            let currentObjectRow = 0;

            vm.tileLayer = new Array(vm.tilesAcross * vm.tilesDown).fill(-1);
            vm.objectLayer = new Array(vm.tilesAcross * vm.tilesDown).fill(-1);

            //Create collision list
            this.collisionStore = [];
            for (let x = 0; x < vm.tilesAcross; x++) {
                this.collisionStore[x] = [];
                for (let y = 0; y < vm.tilesDown; y++) {
                    this.collisionStore[x].push(false);
                    this.collisionStore[x].push(false);
                }
            }

            //First pass build RMM block
            for (let h = 0; h < vm.tilesDown; h++) {
                for (let w = 0; w < vm.tilesAcross; w++) {
                    let block = new RMM();

                    block.object1 = dr.readByte();
                    block.object2 = dr.readByte();
                    block.tile1 = dr.readByte();
                    block.tile2 = dr.readByte();
                    block.cursor1 = dr.readByte();
                    block.unk1 = dr.readByte();
                    block.collision = dr.readByte();

                    if (h === 0) {
                        block.collision = 128; //full collision for top row
                    }

                    block.unk3 = dr.readByte();

                    //set properties to calc values to reduce cpu computation\
                    let rmdNumber = block.tileFileNumber();
                    let rmdIndexNumber = block.tileIndexNumber();

                    let objectFileNumber = block.objectFileNumber();
                    let objectIndexNumber = block.objectIndexNumber();

                    //set collision variables
                    switch (block.collision) {
                        case 0:
                        case 128:
                            this.collisionStore[w][h * 2] = true;
                            this.collisionStore[w][h * 2 + 1] = true;
                            break;
                        case 120:
                        case 248:
                            this.collisionStore[w][h * 2] = false;
                            this.collisionStore[w][h * 2 + 1] = false;
                            break;
                        case 96:
                        case 224:
                            this.collisionStore[w][h * 2] = true;
                            this.collisionStore[w][h * 2 + 1] = false;
                            break;
                        case 24:
                        case 152:
                            this.collisionStore[w][h * 2] = false;
                            this.collisionStore[w][h * 2 + 1] = true;
                            break;
                    }

                    //beginner zone has pockets you can walk through that show up as cursor1 248. Set that block to no walking if cursor is 248???
                    if (block.cursor1 === 248) {
                        this.collisionStore[w][h * 2] = true;
                        this.collisionStore[w][h * 2 + 1] = true;
                    }

                    if (rmdNumber !== 0) {
                        let tileId;
                        let bAddItem = false;

                        if ((!vm.tileTextureLookup[`${rmdNumber}_${rmdIndexNumber}`]) && vm.tileTextureLookup[`${rmdNumber}_${rmdIndexNumber}`] !== 0) {
                            tileId = currentTileColumn + (vm.tilesPerRow * currentTileRow);
                            currentTileColumn++;
                            if (currentTileColumn === vm.tilesPerRow) {
                                currentTileColumn = 0;
                                currentTileRow++;
                            }
                            vm.tileTextureLookup[`${rmdNumber}_${rmdIndexNumber}`] = tileId;
                        } else {
                            tileId = vm.tileTextureLookup[`${rmdNumber}_${rmdIndexNumber}`];
                        }
                        vm.tileLayer[w + (h * vm.tilesAcross)] = tileId;
                        /*if((w + (h * vm.tilesAcross)) == 2149) {
                            //x: 49, y:14 should be 214 but it comes out to 215.
                            console.log('2149 found and is value: ' + tileId);
                        }*/

                        vm.reverseTileInfo[tileId] = { rmdNumber: rmdNumber, rmdIndexNumber: rmdIndexNumber };
                    }

                    if (objectFileNumber !== 0) {
                        let objectId;
                        if (!vm.objectTextureLookup[`${objectFileNumber}_${objectIndexNumber}`] && vm.objectTextureLookup[`${objectFileNumber}_${objectIndexNumber}`] !== 0) {
                            objectId = currentObjectColumn + (vm.tilesPerRow * currentObjectRow);
                            currentObjectColumn++;

                            if (currentObjectColumn === vm.tilesPerRow) {
                                currentObjectColumn = 0;
                                currentObjectRow++;
                            }

                            vm.objectTextureLookup[`${objectFileNumber}_${objectIndexNumber}`] = objectId;
                        } else {
                            objectId = vm.objectTextureLookup[`${objectFileNumber}_${objectIndexNumber}`];
                        }
                        vm.objectLayer[w + (h * vm.tilesAcross)] = objectId;

                        vm.reverseObjectInfo[objectId] = { objectFileNumber: objectFileNumber, objectIndexNumber: objectIndexNumber };
                    }

                    vm.mapData[`${w}_${h}`] = block;
                }
            }

            vm.objectDimensions = [];
            let objDLength = currentObjectColumn + ((vm.tilesPerRow * vm.objectSize.x) * currentObjectRow);
            for (let i = 0; i < objDLength; i++) {
                vm.objectDimensions.push({ x: 0, y: 0 });
            }

            //let tile;

            //let buildGetList = {"cindex": 0, "list": []};
            let loadList = [];
            let objectLoadList = [];
            //let tCount = 0;

            for (let key in vm.tileTextureLookup) {
                let split = key.split('_');
                loadList.push({ "name": `${split[0]}_${split[1]}`, "sp1": split[0], "sp2": split[1], "loaded": false });
            }

            for (let key in vm.objectTextureLookup) {
                let split = key.split('_');
                objectLoadList.push({ "name": `${split[0]}_${split[1]}`, "sp1": split[0], "sp2": split[1], "loaded": false })
            }

            //console.log(loadList);
            await vm.loadMapRMDList(loadList, 0);
            //await vm.loadMapRMDList(objectLoadList, 1);
            console.log(loadList);
            console.log('Done reading map data');
            console.log("fml " + buffer.buffer.length + " " +buffer.currPos + " " + this.mapPath);
            resolve();
        });
    }


    async loadMapRMDList(array, type) {
        //let vm = this;

        return new Promise(async (resolve) => { // eslint-disable-line
            if (type === 0) {
                for (let i = 0; i < array.length; i++) {
                    await this.loadTileAsync(array[i]);
                }
            } else {
                for (let i = 0; i < array.length; i++) {
                    await this.loadObjectAsync(array[i]);
                }
            }

            //console.log(`Done loading list: ${type}.`);
            resolve();
        });
    }

    async loadTileAsync(listitem) {
        return new Promise(async (resolve) => { // eslint-disable-line
            await AssetManager.getTile(listitem.sp1, listitem.sp2);
            resolve();

        });
    }

    async loadObjectAsync(listitem) {
        return new Promise(async (resolve) => { // eslint-disable-line
            await AssetManager.getObject(listitem.sp1, listitem.sp2);
            resolve();
        });
    }

    getTileLayerValue(mapPosition) {
        let vm = this;

        return vm.tileLayer[mapPosition.x + (mapPosition.y * vm.tilesAcross)];
    }

    getObjectLayerValue(mapPosition) {
        return this.objectLayer[mapPosition.x + (mapPosition.y * this.tilesAcross)];
    }

    getTileLayerSourceRectangle(mapPosition) {
        let baseLayerValue = this.getTileLayerValue(mapPosition);

        if (baseLayerValue < 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        return {
            x: parseInt(baseLayerValue % this.tilesPerRow) * this.tileSize.x,
            y: parseInt(baseLayerValue / this.tilesPerRow) * this.tileSize.y,
            width: this.tileSize.x,
            height: this.tileSize.y
        };
    }

    getObjectLayerSourceRectangle(mapPosition) {
        let objectLayerValue = this.getObjectLayerValue(mapPosition);

        if (objectLayerValue < 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        return {
            x: parseInt(objectLayerValue % this.tilesPerRow) * this.tileSize.x,
            y: parseInt(objectLayerValue / this.tilesPerRow) * this.tileSize.y,
            width: this.objectDimensions[objectLayerValue].x,
            height: this.objectDimensions[objectLayerValue].y
        };
    }
}

export {RMM, MapReader};