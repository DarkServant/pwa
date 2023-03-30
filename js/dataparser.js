import {MapReader, RMM} from "./mapReader.js"
import {AssetManager} from "./assetManager.js"
import {RLEReader} from "./rleReader.js"
import {PriorityQueue} from "./priorityqueue.js"


class TileAdjacency{
    tileFileNumber;
    tileIndexNumber;
    tile0;
    options;
    constructor(ptile0){
        this.tile0 = ptile0;

    }
}

class MixedTileAdjacency{
    tileFileNumber;
    tileIndexNumber;
    tile0;
    tile1;
    adjacencyBitmask;
    tiles;
    totalTiles;
    rows;
    cols;
    tile0Ref;
    tile1Ref;
    isOverride;

    constructor(ptile0, ptile1, prows, pcols,pisOverride){
        this.tile0 = ptile0;
        this.tile1 = ptile1;
        this.rows = prows;
        this.cols = pcols;
        this.totalTiles=0;
        this.tiles = [];
        this.tile0Ref = null;
        this.tile1Ref = null;
        this.isOverride = pisOverride;

        for(var i=0;i<this.rows;i++){
            var entry =[];
            for(var j=0;j<this.cols;j++){
                entry.push(-1);
            }
            this.tiles.push(entry);
        }
    }

    markTileUsed(row,col,value){
        if(this.isOverride)
            return;
        //console.log(row + " " + col );
        //console.log(this.tiles);
        if(this.tiles[row][col] == -1){
            this.tiles[row][col]=value;
            this.totalTiles++;
        }
    }

    removedUnused(){
        //if(this.isOverride)
        //    return;
        for(var i=0;i<this.rows && i > -1;i++){
            for(var j=0;j<this.cols && j > -1;j++){
                if(this.tiles[i][j] == -1  ){
                    this.tiles[i].splice(j,1);
                    j--;
                }
            }
        }
    }

    static getTile(object, row){

        if(row== null || row==undefined ){
            var r = Math.floor(Math.random()*object.tiles.length);
            var c = Math.floor(Math.random()*object.tiles[r].length);
            return {row: r, col: c, item: object.tiles[r][c], tile: object };
        }
        if(row == 0){
            return object.tile0Ref.getTile(object.tile0Ref);
        }
        if(row == 15){
            return object.tile1Ref.getTile(object.tile0Ref);
        }

        var col = Math.floor(Math.random()*object.tiles[row-1].length);
        return {row: row, col: col, item: object.tiles[row-1][col], tile: object };
    }

    static getInverseRow(row){
        var bit  = MixedTileAdjacency.rowToBitmask(row);
        var notbit = (8+4+2+1) - bit; 
        var r = MixedTileAdjacency.bitmaskToRow(notbit);
        if(r ==0){
            console.log(row +  " "+ bit + " " + notbit  +" " + r);
            eaae.feaf.eaf;
        }
        return r-1;
    }

    static rowToBitmask(row){
        var options = [
            0b0000,
            0b0001,
            0b0010,
            0b1011 ,
            0b0011,
            0b0111,
            0b1010,
            0b1001,
            0b0110,
            0b0101,
            0b1101,
            0b1100,
            0b1110,
            0b1000,
            0b0100,
            0b1111,];   
            return options[row+1];
    }

    static bitmaskToRow(bitmask){
        var options = [
            0b0000,
            0b0001, // A top left
            0b0010, // B top right
            0b1011 ,
            0b0011,
            0b0111,
            0b1010, //F
            0b1001,
            0b0110,
            0b0101, // I
            0b1101,
            0b1100,
            0b1110,
            0b1000, // M bottom left
            0b0100, // N bottom right
            0b1111,];   
        for(var i=0;i<options.length;i++){
            if(options[i] == bitmask){ 
                return i;
            }
        }
        console.log("aefeafuhuaef " + bitmask);
        eafae.feafe.af;
        return -1;
    }

    static getAcceptableTile(left,up,right,down){
        // 1 yellow
        // 0 green
        var options = [
            0b0000,
            0b0001,
            0b0010,
            0b1011 ,
            0b0011,
            0b0111,
            0b1010,
            0b1001,
            0b0110,
            0b0101,
            0b1101,
            0b1100,
            0b1110,
            0b1000,
            0b0100,
            0b1111,];

        var optionsDic = {
            "0000":0,
            "0001":1,
            "0010":2,
            "1011":3,
            "0011":4,
            "0111":5,
            "1010":6,
            "1001":7,
            "0110":8,
            "0101":9,
            "1101":10,
            "1100":11,
            "1110":12,
            "1000":13,
            "0100":14,
            "1111":15
        };

        var leftMask = 0b0110;
        var rightMask = 0b1001;
        var upMask = 0b0011;
        var downMask = 0b1100;
        if(left != null){
            var lMatch = left & leftMask;
            for(var i=0;i<options.length;i++){
                if(options[i] & leftMask != lMatch){
                    options.splice(i,1);
                    i--;
                }
            }
        }
        if(right != null){
            var rMatch = right & rightMask;
            for(var i=0;i<options.length;i++){
                if(options[i] & rightMask != rMatch){
                    options.splice(i,1);
                    i--;
                }
            }
        }
        if(up != null){
            var uMatch = up & upMask;
            for(var i=0;i<options.length;i++){
                if(options[i] & upMask != uMatch){
                    options.splice(i,1);
                    i--;
                }
            }
        }
        if(down != null){
            var dMatch = down & downMask;
            for(var i=0;i<options.length;i++){
                if(options[i] & downMask != dMatch){
                    options.splice(i,1);
                    i--;
                }
            }
        }
        return options;
        
        
/*
        if(left == 0 ){
            //B =  0b0010
            //H =  0b0110
            //N =  0b0100
        }
        if(left == ub1111 ){
            //C = 0b1011 
            //G = 0b1001
            //J = 0b1101
        }
        if(up == 0 ){
            //K =  0b1100
            //M =  0b1000
            //N =  0b0100
        }
        if(up == ub1111 ){
            //C = 0b1011 
            //D = 0b0011
            //E = 0b0111
        }
        if(right == 0 ){
            //A = 0b0001
            //G = 0b1001
            //M = 0b1000
        }
        if(right == ub1111 ){
            //E = 0b0111
            //H = 0b0110
            //L = 0b1110
        }
        if(down == 0 ){
            //A = 0b0001
            //B = 0b0010
            //D = 0b0011
        }
        if(down == ub1111 ){
            //J = 0b1101
            //K = 0b1100
            //L = 0b1110
        }
        */
    }
}

// collect RLEs + index used in map
// determine whether its an "ALL" RLE, or a transitional RLE
// if transitional, determine which "ALL" RLEs + Index are tile0 and tile1

// determine which tileIndexNumbers are Fully adjacent vs

class DataParser {
    gamemap;
    adjacencyList;
    adjacencyDirections;
    adjacencyDirectionsName;
    tMap;
    tileIdToTextureCoordLookup;
    textureAtlasData;

    objectAdjacencyList;
    objectTileIdToTextureCoordLookup;
    objectTextureAtlasData;

    mixes;
    notMixes;
    //adjacencyBitmask;
    usedTLEs;
    reverseTLEMap;
    allTLEMap;
    constructor(){
        console.log("dp constructor started");
        this.mixes = [];
        this.notMixes = [];
        this.adjacencyList = {};
        this.adjacencyDirections = [{x:-1,y:0},{x:0,y:-1},{x:1,y:0},{x:0,y:1}];
        this.adjacencyDirectionsName = ["left","up","right","down"];
        this.reverseTLEMap = {};
        this.allTLEMap = [];
        /*
        DataParser.adjacencyBitmask = [
            A =  0001
            B =  0010
            #C = 1011 
            D =  0011
            #E = 0111
            F =  1010
            G =  1001
            H =  0110
            I =  0101
            #J = 1101
            K =  1100
            #L = 1110
            M =  1000
            N =  0100
        ]*/
        this.usedTLEs ={};

        this.gamemap = undefined;
        this.tMap = {};
        this.tileIdToTextureCoordLookup = {};
        this.textureAtlasData = [];

        this.objectAdjacencyList = {};
        this.objectTileIdToTextureCoordLookup = {};
        this.objectTextureAtlasData = [];
    }
    async init(){
        console.log("init started");
        RLEReader.init();
        await AssetManager.init("../Redmoon/RLEs/");
        console.log("init finished");
    }

    async readmap(mapNumber){

        this.gamemap = new MapReader();
        await this.gamemap.readMap(`../Redmoon/DATAs/Map/${mapNumber}`);
        console.log("map read finished");
    }

    colorDiff(a,b){

        var r = (a >> 16) & 0xff;
        var g = (a >> 8) & 0xff;
        var b = a && 0xFF;

        var r2 = (b >> 16) & 0xff;
        var g2 = (b >> 8) & 0xff;
        var b2 = b && 0xFF;

        return (r-r2)*(r-r2) + (g-g2)*(g-g2) + (b-b2)*(b-b2);
    }
    checkPixels(src,target,x){
        var cellWidth = 48;
        var cellHeight = 24;
        let sp = AssetManager.reverseVirtualTileDictionary[src].split("_");
        let tileId = sp[0];
        let srcX = parseInt(sp[1]);
        let srcY = parseInt(sp[2]);

        let sp2 = AssetManager.reverseVirtualTileDictionary[target].split("_");
        let tileId2 = sp2[0];
        let srcX2 = parseInt(sp2[1]);
        let srcY2 = parseInt(sp2[2]);

     
        let tileLST = AssetManager.tileListDictionary[tileId];
        let tileLST2 = AssetManager.tileListDictionary[tileId2];
        if(!tileLST || !tileLST2){
            console.log("cp wtf no tileLST " + i + " " + tileId + " " + srcX + " " + srcY);
            
            console.log(AssetManager.tileListDictionary);
        }
        if(!tileLST.isIndexLoaded() || !tileLST2.isIndexLoaded()){
            console.log("cp LST not loadedd :( ");
            console.log(tileLST.dimensions);
        } else {
            var delta =0;
            var meh = 2170;
            if(x==0){
                for(let y=0;y<cellHeight;y++){
                    delta += this.colorDiff(tileLST.data[(srcY + y) * tileLST.dimensions.width +srcX], tileLST2.data[(srcY2 + y) * tileLST2.dimensions.width  + 47+ srcX2]);
                        
                }
                if(delta > cellHeight * meh)
                    return false;
            }
            if (x==1){
                for(let x=0;x<cellWidth;x++){                    
                    delta += this.colorDiff(tileLST.data[srcY*tileLST.dimensions.width + x+ srcX] , tileLST2.data[(srcY2 + 23)* tileLST2.dimensions.width  +x+ srcX2]);
                        
                }
                if(delta > cellWidth * meh)
                return false;
            }
            if (x==2){
                for(let y=0;y<cellHeight;y++){
                    delta +=this.colorDiff(tileLST.data[(srcY + y) * tileLST.dimensions.width + 47 + srcX] , tileLST2.data[(srcY2 + y) * tileLST2.dimensions.width+ srcX2]);
                        
                }
                if(delta > cellHeight * meh)
                return false;
            }
            if (x==3){
                for(let x=0;x<cellWidth;x++){
                    delta += this.colorDiff(tileLST.data[(srcY + 23)*tileLST.dimensions.width + x + srcX] , tileLST2.data[(srcY2)* tileLST2.dimensions.width  +x + srcX2]);
                        
                }
                if(delta > cellWidth * meh)
                return false;
            }
        }
        return true;

    }
    // build adjacency list

    static getColor(a,r,g,b){
        var ret = (a & 0xFF) << 24;
        ret += (b & 0xFF) << 16
        ret += (g & 0xFF) << 8
        ret += (r & 0xFF);
        return ret;
    }

    checkIsMix(tle){
        var split = tle.fileName.split("-");
        if(split[2] == "000"){
            tle.tile0 = split[1].trim();
            tle.isMix = false;
            return false;
        }
        tle.tile0 = split[1].trim();
        tle.tile1 = split[2].trim();
        tle.isMix = true;

        return true;
    }


    async buildAdjacencyList(){
        // sanity check
        var allfound = true;
        this.mixes = {};
        this.notMixes = {};
        this.adjacencyList = {};
        var exemptionList = {
            "t-ac3-ac2":{ 
                "tile0":"ag4", 
                "tile1":"ac2",
                "rows":14,
                "cols":5
            },            
            "t-ac0-ab0":{ 
                "tile0":"ab0", 
                "tile1":"ac0",
                "rows":14,
                "cols":5
            },
            "t-ak3-ak0":{ 
                "tile0":"ak0", 
                "tile1":"ak3",
                "rows":14,
                "cols":5
            },
            "t-aa6-ai1":{ 
                "tile0":"aa0", 
                "tile1":"ai1",
                "tiles": [
                    ["132_0_24"],
                    ["132_96_24"],
                    ["132_0_0"],
                    ["132_48_0"],
                    ["132_96_0"],
                    ["132_48_96"],
                    ["132_48_24"],
                    ["132_48_48"],
                    ["132_0_96"],
                    ["132_0_72"],
                    ["132_48_72"],
                    ["132_96_72"],
                    ["132_0_48]"],
                    ["132_96_48"]
                ],
                "rows":14,
                "cols":1
            },
            "t-aa5-ai1" : {
                "tile0":"aa5", 
                "tile1":"ai1",
                "tiles": [
                    ["132_0_24"],
                    ["132_96_24"],
                    ["132_0_0"],
                    ["132_48_24"],
                    ["132_96_0"],
                    ["132_48_0"],
                    ["132_0_48"],
                    ["132_96_48"], //h
                    ["132_48_96"],
                    ["132_0_96"],
                    ["132_48_72"], // k
                    ["132_96_96"],
                    ["132_0_72]"],
                    ["132_96_72"]
                ],
                "rows":14,
                "cols":1
            }

        }
        var genNormal = function(tileId, xOffset, cols){
            var ret = [];
            for(var i=0;i<14;i++){
                var entry = [];
                for(var j=0;j<cols;j++){
                    entry.push(tileId+"_"+(xOffset + j*48) + "_" + (i*24));
                }
                ret.push(entry);
            }
            return ret;
        }
        exemptionList["t-ac3-ac2"].tiles = genNormal(90,48,exemptionList["t-ac3-ac2"].cols);
        exemptionList["t-ac0-ab0"].tiles = genNormal(23,48,exemptionList["t-ac0-ab0"].cols);
        exemptionList["t-ak3-ak0"].tiles = genNormal(101,48,exemptionList["t-ak3-ak0"].cols);

        // check what LST files are presentin this map...
        var mapLSTs = {};
        for (let h = 0 ; h < this.gamemap.tilesDown ; h++) {
            for (let w = 0 ; w < this.gamemap.tilesAcross ; w++) {
                var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
                var rm =AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];
                if(!rm) continue;
                var rmd = AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`][0];
                var tileId = `${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`;
                mapLSTs[rmd.tileNumber] = AssetManager.tileListDictionary[rmd.tileNumber];
            }
        }

        for(const [key2,value2] of Object.entries(mapLSTs)){
            //console.log(key2);
            if(value2.dimensions == undefined) continue;
            var rows = value2.dimensions.height/24;
            var cols = value2.dimensions.width/48;
            if(this.checkIsMix(value2)){
                var t0 = value2.tile0;
                var t1 = value2.tile1;
                var override = false;
                if(!(!exemptionList[value2.fileName])){
                    t0 = exemptionList[value2.fileName].tile0;
                    t1 = exemptionList[value2.fileName].tile1;
                    rows = exemptionList[value2.fileName].rows;
                    cols = exemptionList[value2.fileName].cols;
                    override=true;
                }
                if(!this.mixes[t0])
                    this.mixes[t0] = {};
                this.mixes[t0][t1] = new MixedTileAdjacency(t0,t1,rows, cols);
                if(override && exemptionList[value2.fileName].tiles != null){
                    for(var i=0;i<rows;i++){
                        for(var j=0;j<cols;j++){
                            this.mixes[t0][t1].tiles[i][j] = exemptionList[value2.fileName].tiles[i][j];
                        }
                    }
                } else {
                    for(var i=0;i<rows;i++){
                        for(var j=1;j<cols;j++){
                            var tileId = `${value2.tileNum}_${j*48}_${i*24}`;
                            this.mixes[t0][t1].tiles[i][j-1] = tileId;
                        }
                    }
                }
                if(!this.mixes[t1]) /// nbad fix
                    this.mixes[t1] = {}; // bad fix
                this.mixes[t1][t0] =this.mixes[t0][t1];// new MixedTileAdjacency(t1,t0,rows, cols); // bad fix
                
                /*if(override){
                    for(var i=0;i<rows;i++){
                        for(var j=0;j<cols;j++){
                            var t = MixedTileAdjacency.getInverseRow(i);
                            this.mixes[t1][t0].tiles[i][j] = exemptionList[value2.fileName].tiles[t][j]
                        }
                    }
                }*/
            } else{
                this.notMixes[value2.tile0] =(new MixedTileAdjacency(value2.tile0, null, rows, cols,false));
                for(var i=0;i<rows;i++){
                    for(var j=0;j<cols;j++){
                        this.notMixes[value2.tile0].markTileUsed(i,j,value2.tileNum + "_" + (j*48) + "_" + (i*24));
                    }
                }
            }
        }

        //ensure we load non mixes when we see mixes
        for(const [key,value] of Object.entries(this.mixes)){
            if(this.notMixes[key] == null){
                // load TLE
                var fnameTarget = `t-${key}-000`;
                console.log("arff miss " + key  + fnameTarget);
                for(const [key2,value2] of Object.entries(AssetManager.tileListDictionary)){
                    if(value2.fileName == fnameTarget){
                        //found
                        console.log("arff found " + key);
                        var rleReader;
                        if(!value2.initialized){
                            var rlePath  = AssetManager.relativePaths + "tle/" + `tle${AssetManager.paddy(value2.fileNum, 5)}.rle`;
                            rleReader = new RLEReader(rlePath);
                            await rleReader.readRle(rlePath);
                            console.log("arf LST  initialized header " + key2);
                        }
                        if(!value2.isIndexLoaded()){
                            console.log("arf LST  initialized load data rmd.tileNumber: " +key2 + " lst FileNumber " + value2.fileNum + " lst Index " + value2.index);
                            rleReader.initializeLST(value2);
                        } 

                        var rows = value2.dimensions.height/24;
                        var cols = value2.dimensions.width/48;
                        this.notMixes[key] = new MixedTileAdjacency(key, null, rows, cols,false);
                        for(var i=0;i<rows;i++){
                            for(var j=0;j<cols;j++){
                                this.notMixes[key].markTileUsed(i,j,value2.tileNum + "_" + (j*48) + "_" + (i*24));
                            }
                        }
                        break;
                    }
                }
            }
        }

        for(const [key,value] of Object.entries(this.notMixes)){
            //check to see if a mix exists
            var found=false;
            for(const [key2,value2] of Object.entries(this.mixes)){
                if(key2 == key){
                    found=true;
                    break;
                }
            }
            if(!found){
                console.log("flyff not found " + key);
            }
        }

        /*
        //console.log(AssetManager.tileDataToVirtualTile);
        var totalAdj =0;
        var padding =0;
        for (let h = 0 + padding; h < this.gamemap.tilesDown - padding; h++) {
            for (let w = 0 + padding; w < this.gamemap.tilesAcross - padding; w++) {
                var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
                var rm =AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];
                if(!rm) continue;
                var rmd = AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`][0];
                var tileId = `${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`;
                
                var akey= AssetManager.tileListDictionary[`${rmd.tileNumber}`].tile0;
                var bkey= AssetManager.tileListDictionary[`${rmd.tileNumber}`].tile1;

                
                if(bkey == null && this.notMixes[akey]){
                    //this.notMixes[akey].markTileUsed(rmd.sourceY/24 , rmd.sourceX/48,tileId)  ;
                } else if(this.mixes[akey]){
                    //console.log(akey + " " + bkey);
                    //console.log(this.mixes[akey]);
                    //this.mixes[akey][bkey].markTileUsed(rmd.sourceY/24 , rmd.sourceX/48,tileId) ;
                    //if(bkey != null){
                    //var inv = MixedTileAdjacency.getInverseRow(rmd.sourceY/24);
                    //cons//ole.log(inv);
                    //this.mixes[bkey][akey].markTileUsed(inv , rmd.sourceX/48,tileId) ;
                    //}
                } 
                
               // AssetManager.tileListDictionary[rmd.tileNumber].tiles[rmd.sourceY/24][rmd.sourceX/48] = 1;
                var tilezId = AssetManager.tileDataToVirtualTile[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];
                if(tileId == undefined){console.log("puber fucked " + w + " " + h + " " + rmmBlock.tileFileNumber() + " " + rmmBlock.tileIndexNumber() )};
                //var tileId = this.gamemap.tileTextureLookup[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];
                //console.log(rmmBlock);
                //console.log(tileId);
                //var tileId = this.gamemap.tileLayer[w + (h * this.gamemap.tilesAcross)];
                if(!this.adjacencyList[tileId]){
                    this.adjacencyList[tileId] = {neighbors:[],tileFileNumber:rmmBlock.tileFileNumber(), tileIndexNumber:rmmBlock.tileIndexNumber()} ;
                    for(var x=0;x<this.adjacencyDirections.length;x++){
                        this.adjacencyList[tileId].neighbors[x] = {};
                    }
                }
                for(var x=0;x<this.adjacencyDirections.length;x++){
                    var tarx = w + this.adjacencyDirections[x].x;
                    var tary = h + this.adjacencyDirections[x].y;
                    if(tarx >=0 && tary >=0 && tarx < this.gamemap.tilesAcross && tary < this.gamemap.tilesDown){
                        var tarrmmBlock = this.gamemap.mapData[`${tarx}_${tary}`];
                        var tarr = AssetManager.tileData[`${tarrmmBlock.tileFileNumber()}_${tarrmmBlock.tileIndexNumber()}`];
                        if(!tarr) continue;
                        var tarrmd = AssetManager.tileData[`${tarrmmBlock.tileFileNumber()}_${tarrmmBlock.tileIndexNumber()}`][0];
                        var tarTile = `${tarrmd.tileNumber}_${tarrmd.sourceX}_${tarrmd.sourceY}`;
                        var tarTLE = AssetManager.tileListDictionary[tarrmd.tileNumber];
                        var rowCt = tarTLE.dimensions.width / 48;
                        var colCt = tarTLE.dimensions.height / 24;
                        var rowin = 1;
                        if(rowCt == 5) // 
                            rowin =0;
                        if(colCt < 5 || rowCt > 6){
                            rowin = tarrmd.sourceX /24;
                            rowCt = rowin+1;
                        }
                        for(var i=rowin;i<rowCt;i++){ // escape the debug tile
                            for(var j=0;j<colCt;j++){
                                tarTile = `${tarrmd.tileNumber}_${i*48}_${j*24}`;
                                if(true){//tarTLE.isMix){
                                    tarTile = `${tarrmd.tileNumber}_${i*48}_${tarrmd.sourceY}`;
                                }
                                var tarTileId = AssetManager.virtualTileDictionary[tarTile];
                                var tarTileObj = AssetManager.virtualTileToTileData[tarTileId];
                                if(!tarTileObj) continue;
                                //console.log(tarTileId);
                                //console.log(tarTileObj);
                                //var tarTile = AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`]
                                var tarTilez = AssetManager.tileDataToVirtualTile[`${tarTileObj.tileFileNumber}_${tarTileObj.tileIndexNumber}`];
                                if(tarTile== undefined){console.log("puber2 fucked " + w + " " + h + " " + rmmBlock.tileFileNumber() + " " + rmmBlock.tileIndexNumber() )};
                                //var tileId = this.ga){console.log("puber fucked " + tarx + " " + tary)};
                                //var tarTile = this.gamemap.tileTextureLookup[`${tarrmmBlock.tileFileNumber()}_${tarrmmBlock.tileIndexNumber()}`];
                                //var tarTile =this.gamemap.tileLayer[tarx + (tary * this.gamemap.tilesAcross)];
                                if(true){//this.checkPixels(tileId,tarTile,x)){
                                    this.adjacencyList[tileId].neighbors[x][tarTile] = {tileFileNumber:tarTileObj.tileFileNumber,tileIndexNumber:tarTileObj.tileIndexNumber }//this.gamemap.reverseTileInfo[tarTile];
                                    if(!this.adjacencyList[tarTile]){
                                        this.adjacencyList[tarTile] = {neighbors:[],tileFileNumber:tarTileObj.tileFileNumber, tileIndexNumber:tarTileObj.tileIndexNumber} ;
                                        for(var x2=0;x2<this.adjacencyDirections.length;x2++){
                                            this.adjacencyList[tarTile].neighbors[x2] = {};
                                        }
                                    }
                                    this.adjacencyList[tarTile].neighbors[(x+2)%4][tileId] = {tileFileNumber:rmmBlock.tileFileNumber(),tileIndexNumber:rmmBlock.tileIndexNumber() }

                                    totalAdj++;
                                } else {
                                    console.log("rejected" + x + " " + tileId + " " + tarTile + " ");
                                }
                                if(true){//tarTLE.isMix){
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log(this.adjacencyList);;
        console.log(Object.keys(this.adjacencyList).length);
        //console.log(feaf.feefe.afeaf);
        for(const [key, value] of Object.entries(this.adjacencyList)) {
            var numNeighbors = 0;
            for(var i=0;i<value.neighbors.length;i++){
                numNeighbors += Object.entries(value.neighbors[i]).length;
            }
            if(numNeighbors ==0){
                console.log("super bad " + key);
            }
        }

        */
        for(const [key,value] of Object.entries(this.notMixes)){
            value.removedUnused();
            //console.log(value.tile0);
        }
        for(const [key,value] of Object.entries(this.mixes)){
            for(const [key2,value2] of Object.entries(value)){
                value2.removedUnused();
                value2.tile0Ref = this.notMixes[value2.tile0];
                value2.tile1Ref = this.notMixes[value2.tile1];
                if(!value2.tile0Ref ){
                    console.log("missing reference tile0Ref" + value2.tile0 + " " + value2.tile1);
                    delete this.mixes[key][key2];
                    delete this.mixes[key2][key];
                    if(Object.entries(this.mixes[key]).length ==0)
                        delete this.mixes[key];
                    if(Object.entries(this.mixes[key2]).length ==0)
                        delete this.mixes[key2];

                    continue;
                    //if(!checkOverrides()){
                        //console.log(value2.tile0Ref);
                        //console.log(value2.tile1Ref);
                    //}
                }
                if(!value2.tile1Ref){
                    console.log("missing reference tile1Ref" + value2.tile0 + " " + value2.tile1);
                    //delete this.mixes[key][key2];
                    //delete this.mixes[key2][key];
                    //if(Object.entries(this.mixes[key]).length ==0)
                    //    delete this.mixes[key];
                    //if(Object.entries(this.mixes[key2]).length ==0)
                    //    delete this.mixes[key2];
                    //continue;
                }
            }
        }


        //console.log("finished building adjacency matrix " + totalAdj/Object.entries(this.adjacencyList).length);
    }


    buildObjectAdjacencyList(){

        this.objectAdjacencyList = {};
        var totalAdj =0;
        var padding =0;
        for (let h = 0 + padding; h < this.gamemap.tilesDown - padding; h++) {
            for (let w = 0 + padding; w < this.gamemap.tilesAcross - padding; w++) {
                var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
                var rm =AssetManager.tileData[`${rmmBlock.objectFileNumber()}_${rmmBlock.objectIndexNumber()}`];
                if(!rm) continue;
                var rmd = AssetManager.tileData[`${rmmBlock.objectFileNumber()}_${rmmBlock.objectIndexNumber()}`][0];
                var tileId = `${rmd.tileNumber}_${rmd.sourceX}_${rmd.sourceY}`;
                if(!this.objectAdjacencyList[tileId]){
                    this.objectAdjacencyList[tileId] = {neighbors:[],tileFileNumber:rmmBlock.objectFileNumber(), tileIndexNumber:rmmBlock.objectIndexNumber()} ;
                    for(var x=0;x<this.adjacencyDirections.length;x++){
                        this.objectAdjacencyList[tileId].neighbors[x] = {};
                    }
                }
                
                for(var x=0;x<this.adjacencyDirections.length;x++){
                    var tarx = w + this.adjacencyDirections[x].x;
                    var tary = h + this.adjacencyDirections[x].y;
                    if(tarx >=0 && tary >=0 && tarx < this.gamemap.tilesAcross && tary < this.gamemap.tilesDown){
                        var tarrmmBlock = this.gamemap.mapData[`${tarx}_${tary}`];
                        var tarr = AssetManager.tileData[`${tarrmmBlock.objectFileNumber()}_${tarrmmBlock.objectIndexNumber()}`];
                        if(!tarr) continue;
                        var tarrmd = AssetManager.tileData[`${tarrmmBlock.objectFileNumber()}_${tarrmmBlock.objectIndexNumber()}`][0];
                        var tarTile = `${tarrmd.tileNumber}_${tarrmd.sourceX}_${tarrmd.sourceY}`;
                        //var tarTile = AssetManager.tileData[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`]
                        var tarTilez = AssetManager.tileDataToVirtualTile[`${tarrmmBlock.objectFileNumber()}_${tarrmmBlock.objectIndexNumber()}`];
                        if(tarTile== undefined){console.log("puber2 fucked " + w + " " + h + " " + rmmBlock.objectFileNumber() + " " + rmmBlock.objectIndexNumber() )};
                        //var tileId = this.ga){console.log("puber fucked " + tarx + " " + tary)};
                        //var tarTile = this.gamemap.tileTextureLookup[`${tarrmmBlock.tileFileNumber()}_${tarrmmBlock.tileIndexNumber()}`];
                        //var tarTile =this.gamemap.tileLayer[tarx + (tary * this.gamemap.tilesAcross)];
                        if(true){//this.checkPixels(tileId,tarTile,x)){
                            this.objectAdjacencyList[tileId].neighbors[x][tarTile] = {tileFileNumber:tarrmmBlock.objectFileNumber(),tileIndexNumber:tarrmmBlock.objectIndexNumber() }//this.gamemap.reverseTileInfo[tarTile];
                            if(!this.objectAdjacencyList[tarTile]){
                                this.objectAdjacencyList[tarTile] = {neighbors:[],tileFileNumber:tarrmmBlock.objectFileNumber(), tileIndexNumber:tarrmmBlock.objectIndexNumber()} ;
                                for(var x2=0;x2<this.adjacencyDirections.length;x2++){
                                    this.objectAdjacencyList[tarTile].neighbors[x2] = {};
                                }
                            }
                            this.objectAdjacencyList[tarTile].neighbors[(x+2)%4][tileId] = {tileFileNumber:rmmBlock.objectFileNumber(),tileIndexNumber:rmmBlock.objectIndexNumber() }

                            totalAdj++;
                        } else {
                            console.log("rejected" + x + " " + tileId + " " + tarTile + " ");
                        }
                    }
                }
            }
        }
    }

// step 1: build tileId adjacency matrix
// step 2?: should we build the texture atlas first so that we can visually watch wave function collapse do its thing?
// step 3: use wave function collapse to determine which RMMs actually get which tiles

// initialize priority queue

    waveFunctionCollapse(mapWidth, mapHeight){

        console.log(this.waveFunctionCollapse);
        console.log("wfn "+ mapWidth + " " + mapHeight);
    
        var genMapWidth = mapWidth;
        var genMapHeight = mapHeight;
        var compare = function(a,b){
            return a.options.length - b.options.length;
        }
        var pq = new PriorityQueue(compare);

        var allOptions = [];
        for (const [key, value] of Object.entries(this.adjacencyList)) {
            allOptions.push(key);
        }
        
        // initialize all RMM positions
        for (let h = 0; h < genMapHeight; h++) {
            for (let w = 0; w < genMapWidth; w++) {
                //var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
                //var tileId = this.gamemap.tileTextureLookup[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];

                var xyLookup = w + (h * genMapWidth);
                //var tileId = this.gamemap.tileLayer[xyLookup];
                var rmmTile = {x:w,y:h,options: [...allOptions], resolvedValue:-1};
                this.tMap[xyLookup] = rmmTile;
                //pq.push(rmmTile);
            }
        }
        pq.push(this.tMap[0]);

        console.log("beginning pq " + pq.size());
        var cacheLite = {};
        var optionsHash = {};
        var candidate ={};
        var backtrackCount =0;
        TopLoop:
        while(!pq.isEmpty()){
            // start resolving shit using random
            var deque = [];
            while(!pq.isEmpty()){
                deque.push(pq.pop());
            }
            for(var i=0;i<deque.length;i++){
                pq.push(deque[i]);
            }
            candidate = pq.pop();    
            if(candidate.resolvedValue != -1) continue;      
            if(candidate.options.length == 0){
                console.log("epic fail " + pq.size());
                continue;
            }
            var roll = Math.random();
            var selectionIndex = Math.floor(roll * candidate.options.length);
            var selectionItem = candidate.options[selectionIndex];

            candidate.resolvedValue = selectionItem;
            var preRemove = candidate.options;
            candidate.options = [selectionItem];
            var candidatexyLookup = candidate.x + (candidate.y * genMapWidth);
            this.tMap[candidatexyLookup] = candidate;
            // update all neighbors
            var preModOptions = [[],[],[],[]];
            for(var x=0;x<this.adjacencyDirections.length;x++){
                var tarx = candidate.x + this.adjacencyDirections[x].x;
                var tary = candidate.y + this.adjacencyDirections[x].y;
                if(tarx >=0 && tary >=0 && tarx < genMapWidth && tary < genMapHeight){
                    //var tarTile = ;//map.tileLayer[tarx + (tary * map.tilesAcross)];
                    var tarxyLookup = tarx + (tary * genMapWidth);//tarTile.x + (tarTile.y * map.tilesAcross);
                    //console.log(tarx + " " +tary + " " + tarxyLookup);
                    preModOptions[x] = this.tMap[tarxyLookup].options;
                    if(this.tMap[tarxyLookup].resolvedValue == -1){
                        var invNeighbor = (x+2)%4;
                        
                        // hasnt been resolved, so update its options
                        
                        var newOptions = [];
                        if(cacheLite[candidate.resolvedValue] && cacheLite[candidate.resolvedValue][invNeighbor] && cacheLite[candidate.resolvedValue][invNeighbor].length > 0)
                        {
                            newOptions = [...cacheLite[candidate.resolvedValue][invNeighbor]];
                            //console.log("cache hit!");
                            //console.log(cacheLite[selectionItem][invNeighbor]);
                        } else {
                            // we should replace this with a reverse lookup

                            //adjacencyList[tileId].neighbors[x][tarTile] = map.reverseTileInfo[tarTile];
                            //console.log("searching " + tarxyLookup);
                            for (const [key, value] of Object.entries(this.adjacencyList)) {
                                for (const [key2, value2] of Object.entries(this.adjacencyList[key].neighbors[invNeighbor])) {
                                    if(key2 == candidate.resolvedValue){
                                        // then key is a valid option
                                        newOptions.push(key);
                                        //console.log("option found " + key);
                                    }
                                }
                            }
                            if(!cacheLite[candidate.resolvedValue]){
                                cacheLite[candidate.resolvedValue] = [[],[],[],[]];
                            }
                            cacheLite[candidate.resolvedValue][invNeighbor] = newOptions;
                        }
                        // intersect results
                        var filteredArray = this.tMap[tarxyLookup].options.filter(function(n) {
                            return newOptions.indexOf(n) !== -1;
                        });
                        if(filteredArray.length ==0){
                            //console.log("fucked. no options left. " + pq.size() + " items remaining");
                            // back track
                            /*
                            for(var y=0;y<this.adjacencyDirections.length;y++){
                                var ztarx = candidate.x + this.adjacencyDirections[y].x;
                                var ztary = candidate.y + this.adjacencyDirections[y].y;
                                if(ztarx >=0 && ztary >=0 && ztarx < genMapWidth && ztary < genMapHeight){
                                    var ztarxyLookup = ztarx + (ztary * genMapWidth);
                                    this.tMap[ztarxyLookup].options = [...preModOptions[y]];
                                }
                            }*/
                            //candidate.options = preRemove;
                            //candidate.options.splice(selectionIndex,1);
                            //candidate.resolvedValue = -1;
                            //if(backtrackCount < 100){
                                //pq.push(candidate);
                            //}
                            //backtrackCount++;
                            //console.log("backtrack count: " + backtrackCount);
                            //continue TopLoop;
                            this.tMap[tarxyLookup].options=filteredArray;

                        }else {
                            this.tMap[tarxyLookup].options=filteredArray;
                        }
                        if(this.tMap[tarxyLookup].resolvedValue == -1) pq.push(this.tMap[tarxyLookup]);
                    }
                }
            }
            backtrackCount =0;
        }
        console.log("finished generating map");
        //console.log(this.tMap);
        return this.tMap;
    }

// step 4? If we didn't already, build a texture atlas of the selected tileIds, keep track of texture coordinates per tileId 
buildTextureAtlas(){
        
    //console.log(AssetManager.reverseVirtualTileDictionary.length + " " + Object.keys(AssetManager.virtualTileDictionary).length);

    this.tileIdToTextureCoordLookup = {};
    var atlasWidth = 4096;
    var atlasRowCount =0 ;
    var atlasColumnCount =0;
    var atlasPad = 2;
    var cellHeight = 24+atlasPad*2;
    var cellWidth = 48+atlasPad*2;
    var numItemsPerRow = Math.floor(atlasWidth / cellWidth);
    atlasWidth = numItemsPerRow*cellWidth;
    // how many total TLEs are there?
    var totalTLEs = 0;
    this.allTLEMap = [];
    this.reverseTLEMap = {};
    for(const [key,value] of Object.entries(this.mixes)){
        for(const [key2,value2] of Object.entries(value)){
            for(var i=0;i< value2.tiles.length;i++){
                for(var j=0;j<value2.tiles[i].length;j++){
                    if(this.reverseTLEMap[value2.tiles[i][j]] == null || this.reverseTLEMap[value2.tiles[i][j]] == undefined){
                        this.reverseTLEMap[value2.tiles[i][j]] = this.allTLEMap.length;
                        this.allTLEMap.push(value2.tiles[i][j]);
                    }
                }
            }
        }
    }
    for(const [key,value] of Object.entries(this.notMixes)){
        for(var i=0;i< value.tiles.length;i++){
            for(var j=0;j<value.tiles[i].length;j++){
                if(this.reverseTLEMap[value.tiles[i][j]] == null || this.reverseTLEMap[value.tiles[i][j]] == undefined){
                    this.reverseTLEMap[value.tiles[i][j]] = this.allTLEMap.length;
                    this.allTLEMap.push(value.tiles[i][j]);
                }
            }
        }
    }
    totalTLEs = this.allTLEMap.length;

    var numRows = Math.ceil( totalTLEs/ numItemsPerRow);
    var atlasHeight = (numRows)*cellHeight;
    this.textureAtlasData = new Uint32Array(atlasHeight * atlasWidth );
    //console.log(this.textureAtlasData);
    var pxCount =0;
    console.log("numItemsPerRow " + numItemsPerRow + " atlasWidth " + atlasWidth + " numRows " +numRows);
    for(let i=0;i< atlasHeight;i++){
        for(let j=0;j<atlasWidth;j++){
            this.textureAtlasData[i*atlasWidth + j] = 0xFF0000FF;// + (parseInt(j / cellWidth)*0x00001000) + (parseInt(i / cellHeight)*0x00000010)  ;
        }
    }
    
    //console.log(this.allTLEMap);
    // we just need to iterate through all mixes and non mixes
    //var keys = Object.keys(this.adjacencyList)
    for(var i=0;i<this.allTLEMap.length;i++){
    //for (let i=0;i< AssetManager.reverseVirtualTileDictionary.length;i++) {
        //let sp = AssetManager.reverseVirtualTileDictionary[i].split("_");
        var key = this.allTLEMap[i];
        //console.log(i + " _ " + this.allTLEMap.length);
        //console.log(key);
        if(key == undefined || key == null) {
            console.log(i + " _ " + this.allTLEMap.length);
            continue;   
        };
        let sp = this.allTLEMap[i].split("_");
        let tileId = sp[0];
        let srcX = parseInt(sp[1]);
        let srcY = parseInt(sp[2]);
        //let tileId = key;//value.resolvedValue;
        if(!(this.allTLEMap[i] in this.tileIdToTextureCoordLookup)){
            this.tileIdToTextureCoordLookup[this.allTLEMap[i]] = {x:atlasColumnCount*1.0/numItemsPerRow,y:atlasRowCount*1.0/numRows};

            // blit texture atlas
            let tileLST = AssetManager.tileListDictionary[tileId];
            this.usedTLEs[tileId] = tileLST;
            if(!tileLST){
                console.log("wtf no tileLST " + i + " " + tileId + " " + srcX + " " + srcY);
                
                console.log(AssetManager.tileListDictionary);
            }
            if(!tileLST.isIndexLoaded()){
                console.log("LST not loadedd :( ");
                console.log(tileLST.dimensions);
            } else {
                //console.log("LST blitting: "+ tileLST.tileNum + " "  + tileLST.fileNum + "," + tileLST.index);
                for(let y=0;y<cellHeight;y++){
                    for(let x=0;x<cellWidth;x++){
                        let srcPixelCopyY = srcY + y - atlasPad;
                        let srcPixelCopyX = srcX + x - atlasPad;
                        if(x < atlasPad){ srcPixelCopyX=0+srcX};
                        if(x >= 47 + atlasPad) {srcPixelCopyX=47+srcX};
                        
                        if(y < atlasPad) {srcPixelCopyY=0+srcY};
                        if(y >= 23 + atlasPad) {srcPixelCopyY=23+srcY};

                        //this.textureAtlasData[pxCount] = tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX];
                        
                        pxCount++;

                        this.textureAtlasData[atlasWidth*(atlasRowCount*cellHeight+y) + atlasColumnCount*cellWidth+x] = tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX];
                        if(!tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX]){
                            console.log("no data. srcPixelCopyY " + srcPixelCopyY + " width " + tileLST.dimensions.width  + " srcPixelCopyX " + srcPixelCopyX);
                        }
                    }
                }
            }

            atlasColumnCount++;
            if(atlasColumnCount >= numItemsPerRow){
                atlasRowCount++;
                atlasColumnCount=0;
                //console.log("turn over! " + atlasRowCount + " " + pxCount);
            }
        } else {
            console.log("aefea dup " + this.allTLEMap[i]);
        }
    }
    console.log("finished building texture atlals " + pxCount);
    //console.log(this.textureAtlasData);
    return {data:this.textureAtlasData, width:atlasWidth, height: atlasHeight, textureCoordMap: this.tileIdToTextureCoordLookup, maxAtlas:{x:atlasColumnCount, y:atlasRowCount}};
    //console.log(this.tileIdToTextureCoordLookup);
}

    buildTextureAtlasLegacy(){
        
        console.log(AssetManager.reverseVirtualTileDictionary.length + " " + Object.keys(AssetManager.virtualTileDictionary).length);
    
        this.tileIdToTextureCoordLookup = {};
        var atlasWidth = 4096;
        var atlasRowCount =0 ;
        var atlasColumnCount =0;
        var atlasPad = 2;
        var cellHeight = 24+atlasPad*2;
        var cellWidth = 48+atlasPad*2;
        var numItemsPerRow = Math.floor(atlasWidth / cellWidth);
        atlasWidth = numItemsPerRow*cellWidth;
        // how many total TLEs are there?
        var totalTLEs = AssetManager.reverseVirtualTileDictionary.length;

        var numRows = Math.ceil( totalTLEs/ numItemsPerRow);
        var atlasHeight = (numRows)*cellHeight;
        this.textureAtlasData = new Uint32Array(atlasHeight * atlasWidth );
        console.log(this.textureAtlasData);
        var pxCount =0;
        console.log("numItemsPerRow " + numItemsPerRow + " atlasWidth " + atlasWidth + " numRows " +numRows);
        for(let i=0;i< atlasHeight;i++){
            for(let j=0;j<atlasWidth;j++){
                this.textureAtlasData[i*atlasWidth + j] = 0xFF0000FF;// + (parseInt(j / cellWidth)*0x00001000) + (parseInt(i / cellHeight)*0x00000010)  ;
            }
        }
        
        // we just need to iterate through all mixes and non mixes
        var keys = Object.keys(this.adjacencyList)
        for(let i=0;i<keys.length;i++){
        //for (let i=0;i< AssetManager.reverseVirtualTileDictionary.length;i++) {
            //let sp = AssetManager.reverseVirtualTileDictionary[i].split("_");
            let sp = keys[i].split("_");
            let tileId = sp[0];
            let srcX = parseInt(sp[1]);
            let srcY = parseInt(sp[2]);
            //let tileId = key;//value.resolvedValue;
            if(!(keys[i] in this.tileIdToTextureCoordLookup)){
                this.tileIdToTextureCoordLookup[keys[i]] = {x:atlasColumnCount*1.0/numItemsPerRow,y:atlasRowCount*1.0/numRows};

                // blit texture atlas
                let tileLST = AssetManager.tileListDictionary[tileId];
                this.usedTLEs[tileId] = tileLST;
                if(!tileLST){
                    console.log("wtf no tileLST " + i + " " + tileId + " " + srcX + " " + srcY);
                    
                    console.log(AssetManager.tileListDictionary);
                }
                if(!tileLST.isIndexLoaded()){
                    console.log("LST not loadedd :( ");
                    console.log(tileLST.dimensions);
                } else {
                    //console.log("LST blitting: "+ tileLST.tileNum + " "  + tileLST.fileNum + "," + tileLST.index);
                    for(let y=0;y<cellHeight;y++){
                        for(let x=0;x<cellWidth;x++){
                            let srcPixelCopyY = srcY + y - atlasPad;
                            let srcPixelCopyX = srcX + x - atlasPad;
                            if(x < atlasPad){ srcPixelCopyX=0+srcX};
                            if(x >= 47 + atlasPad) {srcPixelCopyX=47+srcX};
                            
                            if(y < atlasPad) {srcPixelCopyY=0+srcY};
                            if(y >= 23 + atlasPad) {srcPixelCopyY=23+srcY};

                            //this.textureAtlasData[pxCount] = tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX];
                            
                            pxCount++;

                            this.textureAtlasData[atlasWidth*(atlasRowCount*cellHeight+y) + atlasColumnCount*cellWidth+x] = tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX];
                            if(!tileLST.data[srcPixelCopyY*tileLST.dimensions.width + srcPixelCopyX]){
                                console.log("no data. srcPixelCopyY " + srcPixelCopyY + " width " + tileLST.dimensions.width  + " srcPixelCopyX " + srcPixelCopyX);
                            }
                        }
                    }
                }

                atlasColumnCount++;
                if(atlasColumnCount >= numItemsPerRow){
                    atlasRowCount++;
                    atlasColumnCount=0;
                    //console.log("turn over! " + atlasRowCount + " " + pxCount);
                }
            } else {
                console.log("aefea dup");
            }
        }
        console.log("finished building texture atlals " + pxCount);
        console.log(this.textureAtlasData);
        return {data:this.textureAtlasData, width:atlasWidth, height: atlasHeight, textureCoordMap: this.tileIdToTextureCoordLookup, maxAtlas:{x:atlasColumnCount, y:atlasRowCount}};
        //console.log(this.tileIdToTextureCoordLookup);
    }
// step 5: map texture coordinates to the floor geometry to the atlas
// step 6: profit

//console.log(adjacencyList);


}

export {DataParser, MixedTileAdjacency};