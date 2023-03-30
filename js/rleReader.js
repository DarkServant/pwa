import { DataReader } from "./datareader.js";

class RLEReader {
    rlePath;
    imageAddress;
    initialized;
    dr;
    constructor(prlePath){
        this.rlePath = prlePath;
        this.imageAddress = [];
        this.initialized=false;
        this.dr = undefined;
    }
    
    async readRle(rlePath) {
        return new Promise((resolve) => {
            let vm = this;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', rlePath, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = async function(e) {
                let buffer = new Uint8Array(this.response);
                console.log("loaded "+ rlePath);
                await vm.readData({ buffer: buffer, currPos: 0 });

                resolve();
            };

            xhr.send();
        });
    }

    async readData(buffer) {
        return new Promise(async (resolve) => { // eslint-disable-line
            
            this.dr = new DataReader(buffer);
            let vm = this;
            //vm.headerLength = this.dr.readByte();
            //console.log(`rle header length ${vm.headerLength}`);
            //console.log(`dr cursor ${vm.dr.data.currPos}`);

            let headerText = vm.dr.readString();
            if (headerText !== "Resource File") {
                console.log(`Invalid RLE Header: ${vm.headerLength} ${headerText}`)
            }

            let unk1 = vm.dr.readUInt32();
            let total = vm.dr.readUInt32();

            for (let i = 0; i < total; i++) {
                vm.imageAddress[i] = vm.dr.readUInt32();
            }
    
            vm.initialized = true;
            console.log("RLE initialized " + total);

            resolve();
        });
    }

    static colorPalette=[];
    static init(){
        RLEReader.colorPalette=[];
        //initialize the RLE color palette
        for (let i = 0; i < 256; i++) {
            for (let j = 0; j < 256; j++) {
                let tmpr = Math.floor(j / 2) * 2;//254
                let tmpg = Math.floor(j % 8) * 32;//224
                let tmpb = i * 8;//912
                tmpb = tmpb + (i % 8);//2 914
        
                while (tmpb > 255) {//3
                    tmpg += 4;
                    tmpb -= 256;
                }
        
                tmpg = tmpg + (tmpg % 2);
                while (tmpg > 255) {
                    tmpr += 2;
                    tmpg -= 256;
                }
        
                tmpr = tmpr + (tmpr % 2);
                while (tmpr > 255) {
                    tmpr -= 256;
                }
        
                RLEReader.colorPalette[`${i}_${j}`] = { "red": Math.floor(tmpr), "green": Math.floor(tmpg), "blue": tmpb };
            }
        }
    }

    indexCount() {
        return imageAddress.Length();
    }

    initializeLST(pLST) {
        let vm = this;
        //todo: implement this function 1/12/2015
        //pLST.Data = GetRaw(pLST.Index, false, out dimensions);

        let rawD = vm.getRaw(pLST, false);
        pLST.data = rawD.data;
        pLST.dimensions = rawD.dimensions;
        
        pLST.initialized = true;
        
        console.log(`LST  initialized ${pLST.fileName} ${pLST.fileNum} ${pLST.tileNum} ${pLST.dimensions.width} ${pLST.dimensions.height}`);
    }

    async loadPNGImage(pLST) {
        let that = this;
        return new Promise((resolve) => {
            pLST.initialized = true;

            readFileCB(this.rlePath, function(retObj) {
                let image = new Image();
                let base64String = btoa(String.fromCharCode.apply(null, retObj.buffer));

                image.src = `data:image/png;base64,${base64String}`;
                pLST.data = image;
                resolve();
            });



        });

    }

    hexToBase64(str) {
        return String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "));
    }

    getRaw(pLST, pIsShadow) {
        let vm = this;
        let imgcanvas = document.createElement('canvas'); // replace with offscreen canvas
        let imgcanvasctx = imgcanvas.getContext('2d');

        let pIndex = pLST.index;
        let buffer = vm.dataReader;
        let pDimensions = undefined;

        let startPos = -1,
            xPos = 0,
            yPos = 0,
            type,
            type2,
            shiftAmount;

        let imageInfo = {
            totalImages: 0,
            width: 0,
            height: 0,
            startPos: 0,
            unk1: 0,
            unk2: 0,
            unk3: 0,
            unk4: 0,
            unk5: 0,
            unk6: 0,
            unk7: 0,
            complete: false,
            data: 0
        };


        if (!vm.initialized) {
            console.log("You must initialize reader with ReadHeader before trying to read an image");
        }

        if (pIndex > vm.imageAddress.Length) {
            console.log("Invalid index.");
            //throw new Exception("Invalid index.");
        }

        vm.dr.data.currPos = vm.imageAddress[pIndex];

        imageInfo.startPos = vm.dr.readUInt32();	//aka size?

        xPos = vm.dr.readUInt32();
        yPos = vm.dr.readUInt32();

        imageInfo.width = vm.dr.readUInt32();
        imageInfo.width += xPos;

        imageInfo.height = vm.dr.readUInt32();
        imageInfo.height += yPos;

        imageInfo.unk1 = vm.dr.readUInt32();
        imageInfo.unk2 = vm.dr.readUInt32();
        imageInfo.unk3 = vm.dr.readUInt32();

        imageInfo.unk4 = vm.dr.readByte();
        imageInfo.unk5 = vm.dr.readByte();
        imageInfo.unk6 = vm.dr.readByte();
        imageInfo.unk7 = vm.dr.readByte();

        type = vm.dr.readByte();


        let total = 0,
            c1 = 0,
            c2 = 0,
            cBoth = "";

        imgcanvas.width = imageInfo.width;
        imgcanvas.height = imageInfo.height;

        pDimensions = {};
        pDimensions.width = imageInfo.width;
        pDimensions.height = imageInfo.height;

        if (imgcanvas.width === 0 || imgcanvas.height === 0) return { "data": undefined, "dimensions": pDimensions };

        let imgData = imgcanvasctx.createImageData(imageInfo.width, imageInfo.height);
        imgData = new Uint32Array(imageInfo.width * imageInfo.height);

        try {
            while (true) { // eslint-disable-line

                switch (type) {
                    case 1:
                        //UInt32 total;
                        total = vm.dr.readUInt32();

                        if (total === 0) {
                            //console.log('finished1?')
                            imageInfo.complete = true;
                            break;
                        }

                        for (let j = 0; j < total; j++) {
                            c1 = vm.dr.readByte();
                            c2 = vm.dr.readByte();
                            cBoth = `${c1}_${c2}`;

                            if (!RLEReader.colorPalette[cBoth]) console.log('C1: ' + c1 + ' c2:' + c2);
                            let placement = ((yPos * (imageInfo.width )) + (xPos ));
                            imgData[placement] = (RLEReader.colorPalette[cBoth].red & 0xFF);
                            imgData[placement] = imgData[placement] | ((RLEReader.colorPalette[cBoth].green & 0xFF) << 0x08);
                            imgData[placement] = imgData[placement] | ((RLEReader.colorPalette[cBoth].blue & 0xFF)<< 0x10);
                            imgData[placement] = imgData[placement] | (0xFF << 0x18);
/*
                            imgData.data[placement] = RLEReader.colorPalette[cBoth].red;
                            imgData.data[placement + 1] = RLEReader.colorPalette[cBoth].green;
                            imgData.data[placement + 2] = RLEReader.colorPalette[cBoth].blue;
                            imgData.data[placement + 3] = 255;
*/
                            xPos++;
                        }

                        break;
                    case 2:
                        shiftAmount = vm.dr.readUInt32();
                        xPos += shiftAmount / 2;
                        break;
                    case 3: {
                        let t1 = 0;

                        yPos++;
                        type2 = vm.dr.readByte();

                        switch (type2) {
                            case 0:
                                imageInfo.complete = true;
                                break;
                            case 1:
                                t1 = vm.dr.readUInt32();

                                for (var q = 0; q < t1; q++) {
                                    buffer.currPos += 2;
                                    xPos++;
                                }
                                break;
                            case 2:
                                shiftAmount = vm.dr.readUInt32();
                                xPos += parseInt(shiftAmount) / 2;
                                break;
                            case 3:
                                yPos++;
                                break;
                        }

                        break;
                    }
                    default:
                        console.log(`Invalid RLE Encoding: ${type}\n* Possible Chinese encoded RLE?`);
                        break;
                }
                if (imageInfo.complete) break;

                type = vm.dr.readByte();
            }

/*
            imgcanvasctx.putImageData(imgData, 0, 0);
            var image = new Image();
            image.id = `${pLST.fileNum}_${pLST.index}`;
            image.src = imgcanvas.toDataURL();

            imageInfo.data = image;
*/
            pLST.loaded[pLST.index] = true;
            return { "data": imgData, "dimensions": pDimensions };
        } catch (error) {
            console.log(`Error loading file: ${error}`);
            return { "data": undefined, "dimensions": pDimensions };
        }


    }
    async load() {
        try {
            return new Promise((resolve) => {
                var vm = this;
                readFileCB(this.rlePath, function(retObj) {
                    vm.dataReader = retObj;
                    resolve(vm.dataReader);
                });
            });
        } catch (error) {
            console.log(`Error: ${error}`);
        }

    }
}

export {RLEReader};