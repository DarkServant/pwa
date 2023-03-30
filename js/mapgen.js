import {PriorityQueue} from "./priorityqueue.js";
import {MixedTileAdjacency} from "./dataparser.js";

var building = true;


var postMessageData= {};
var startTime =0 ;
var perfStart;
var updateMult = 10000;
var qpostMessage = function(data){

    if(data[0] == "buildComplete"){
        postMessage([postMessageData]);
        postMessage(["buildComplete"]);
        postMessageData = {};
        console.log("hooray");
        return;
    }
    postMessageData[data[0]] = data[1];
    startTime++;
    if(startTime > updateMult){
        postMessage([postMessageData]);
        postMessageData = {};
        startTime = 0;
        /*
        if(!perfStart) {perfStart = performance.now();}
        else {
            var now = performance.now();
            if(now - perfStart < 50){
                perfStart=now;
                updateMult = updateMult * 2;
                console.log("upate mult " +updateMult);
            }
        }*/
    }
}



var waveFunctionCollapse = function(mapWidth, mapHeight, adjacencyList, postMessage, mixes, notMixes){
    console.time("wfc");
    var adjacencyDirections = [{x:-1,y:0},{x:0,y:-1},{x:1,y:0},{x:0,y:1}];
    var genMapWidth = mapWidth;
    var genMapHeight = mapHeight;
    var tMap = {};

    var aq = [];
    var tq = [];
    
    // initialize all RMM positions
    for (let h = 0; h < genMapHeight; h++) {
        for (let w = 0; w < genMapWidth; w++) {
            //var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
            //var tileId = this.gamemap.tileTextureLookup[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];

            var xyLookup = w + (h * genMapWidth);
            //var tileId = this.gamemap.tileLayer[xyLookup];
            var rmmTile = {x:w,y:h,options: [], resolvedValue:-1, resolvedTileType:-1};
            tMap[xyLookup] = rmmTile;
            aq.push(rmmTile);
        }
    }
    console.time("wfc1");
    var debugStr = "";
    var aqWidth = (genMapWidth+1);
    var aqHeight = genMapHeight+1;
    var ptIndex0 = -1;
    var ptIndex1 = -aqWidth;
    var ptIndex2 = -aqWidth -1;
    var ptIndex3 = -aqWidth +1;
    for (let h = 0; h < aqHeight; h++) {
        for (let w = 0; w < aqWidth; w++) {
            var encountered = new Set();
            var totencountered = new Set();
            var lp=-1;
            //check rect down and left
            if(w > 0){
                lp=tq[math];
                var math = ptIndex0;//(w-1) + h*(aqWidth);
                encountered.add(tq[math]);
                totencountered.add(tq[math]);
            }
            if(h > 0){
                var math = ptIndex1;//(w) + (h-1)*(aqWidth);
                encountered.add(tq[math]);
                totencountered.add(tq[math]);
            }
            if(w > 0 && h > 0){ 
                var math = ptIndex2;//(w-1) + (h-1)*(aqWidth);
                encountered.add(tq[math]);
                totencountered.add(tq[math]);
            }
            //var rect1Uniques = Object.entries(encountered).length;
            var rect1Uniques = encountered.size;

            //check right down and right
            var encountered2 = new Set();
            
            //if(w < genMapWidth+1){
            //    encountered2[tq[(w+1) * h*(genMapWidth+1)]] = 1;
            //    totencountered[tq[(w+1) * h*(genMapWidth+1)]] = 1;
            //}
            if(h > 0){
                var math = ptIndex1;//(w) + (h-1)*(aqWidth);
                encountered2.add(tq[math]);//] = 1;
                totencountered.add(tq[math]);//] = 1;
            }
            if(w+1 < aqWidth && h > 0){ 
                var math = ptIndex3;//(w+1) + (h-1)*(aqWidth);
                encountered2.add(tq[math]);// = 1;
                totencountered.add(tq[math]);// = 1;
            }
            ptIndex0++;
            ptIndex1++;
            ptIndex2++;
            ptIndex3++;
            //var rect2Uniques = Object.entries(encountered).length;
            //var rectUniques = Object.entries(totencountered).length;
            var rectUniques = totencountered.size;
            var rect2Uniques = encountered2.size;

            var selected = -1;
            var wholePermitted = true;
            if(w > 1 && h > 1 && rect1Uniques == 1){
                if(lp > -1 && notMixes[lp] == null)
                    wholePermitted= false;
            }

            if (rectUniques == 3){
                // need to figure out which one we have to pick
                for (const [key, value] of encountered.entries()) {
                    for (const [key2, value2] of encountered2.entries()) {
                        if(key == key2){
                            selected = key;
                            break;
                        }
                    }
                }
            } else if(rectUniques == 2){
                // doesnt matter pick one
                var ct =0;
                var choice = Math.floor(Math.random() * 2);
                if(!wholePermitted)
                    choice = 1;
                selected = totencountered[choice];
                for (const [key, value] of totencountered.entries()) {
                    selected=key;
                    if(ct == choice)
                        break;
                    ct++;
                }
            } else if(rectUniques == 1){
                // pick the one, or choose a random mix
                var ct =0;
                var sameness = 25;
                var sel;//=totencountered.entries[0];
                for (const [key, value] of totencountered.entries()) {
                    sel=key;
                }
                var choice = Math.floor(Math.random() * sameness);
                if(!mixes[sel]){
                    choice=0;
                }
                if(Object.entries(mixes).length == 0 || (wholePermitted && choice < (sameness-1))){
                    //selected=totencountered[0];
                    for (const [key, value] of totencountered.entries()) {
                        selected=key;
                    }
                } else {
                    if(!mixes[sel]){
                        console.log(totencountered);
                        console.log(debugStr);
                    }
                    var chl = Object.entries(mixes[sel]).length; 
                    var choice2 = Math.floor(Math.random() * chl);
                    var ct =0;
                    for (const [key, value] of Object.entries(mixes[sel])) {
                        selected=key;
                        if(ct == choice2)
                            break;
                        ct++;
                    }
                    //if(!mixes[sel][selected] || !mixes[selected][sel] ){
                    //    console.log("one fucked up hard " +sel + " " + selected + " " + chl + " " + choice2 + " " + ct);
                   // }
                }
            } else if(rectUniques == 0){
                // initial state, choose random
                var chl = Object.entries(notMixes).length; 
                var choice2 = Math.floor(Math.random() * chl);
                var ct =0;
                for (const [key, value] of Object.entries(notMixes)) {
                    selected=key;
                    if(ct == choice2)
                        break;
                    ct++;
                }
                //if(Object.entries(mixes[selected]).length <= 0){
                //    console.log("initial fucked up hard " + selected);
                //}
            } //else {
                //console.log(fucked + " " + rectUniques);
                //console.log(debugStr);
                //fafe.aef.aef;
            //}
            tq.push(selected);
            //debugStr = debugStr + " " + selected;

        }
        //debugStr = debugStr + "\n";
    }
    console.timeEnd("wfc1");

    console.time("wfc2");
    for (let h = 0; h < genMapHeight && building; h++) {
        for (let w = 0; w < genMapWidth && building; w++) {
            var p1 = tq[w + h * aqWidth];       // bottom left  0b1000  Visually top left       Vissually bottom left
            var p2 = tq[w+1 + h * aqWidth];     // bottom right 0b0100  Visually top right      Visually bottom right
            var p3 = tq[w+1 + (h+1) * aqWidth]; // top right    0b0010  Visually bottom right   Visually top right
            var p4 = tq[w + (h+1) * aqWidth];   // top left     0b0001  Visually bottom left    Visually top left

            var tile0 = p1;
            var tile1 = null;
            var bitmask =0;

            // check if p1 is tile0 or tile1
            
            //bitmask = bitmask | 0b1000;
            if(p1 != p2){
                tile1 = p2;
                //bitmask = bitmask | 0b0010;
                bitmask = bitmask | 0b0010;
                //bitmask = bitmask | 0b0001;
                //bitmask = bitmask | 0b1000;
                //bitmask = bitmask +4 ;//| 0b0100;
            }
            if(p1 != p3){
                if(tile1 != null && tile1 != p3){
                    console.log("fuc " + tile1 + " " + p3);
                    eaf.aef.ae.f;
                }
                tile1 = p3;
                //bitmask = bitmask | 0b0100;
                bitmask = bitmask | 0b0100;
                //bitmask = bitmask | 0b1000;
                //bitmask = bitmask | 0b0001;
                //bitmask = bitmask + 2;//| 0b0010;
            }
            
            if(p1 != p4){
                if(tile1 != null && tile1 != p4){
                    console.log("fuc " + tile1 + " " + p4);
                    eaf.aef.ae.f;
                }
                tile1 = p4;
                bitmask = bitmask | 0b1000;
                //bitmask = bitmask | 0b0100;
                //bitmask = bitmask | 0b0010;
                //bitmask = bitmask +1;// | 0b0001;
            }

            
            var tileRef = null;
            var selected;
            if(tile1 == null) {
                tileRef = notMixes[tile0];
                if(!notMixes[tile0]){
                    console.log(tile0);
                    console.log(notMixes);
                }
                selected = MixedTileAdjacency.getTile(tileRef);
            }else {
                tileRef = mixes[tile0][tile1];
                if(tileRef == null){
                    tileRef = mixes[tile1][tile0];
                }
                if(tileRef == null){
                    console.log("tile0: " + tile0 + " , tile1: " + tile1  );
                    console.log("w: " + w + " , h: " + h  );
                    qpostMessage(["buildComplete"]);
                }
                if(tileRef.tile0 == p1){

                } else {
                    bitmask = 15 - bitmask;
                }
                var row = MixedTileAdjacency.bitmaskToRow(bitmask);
                if(tileRef == null){
                    console.log(tile0 + " " + tile1);
                    console.log(bitmask + " " + row);
                    console.log(mixes[tile0]);
                    console.log(mixes[tile1]);
                }
                selected = MixedTileAdjacency.getTile(tileRef,row);
            }

            var xyLookup = w + (h * genMapWidth);
            tMap[xyLookup].resolvedValue = selected;
            
            qpostMessage([xyLookup,selected.item]);

        }
    }
    console.timeEnd("wfc2");

    console.log("finished generating map");
    //console.log(tMap);
    //console.log(debugStr);    
    console.timeEnd("wfc");
    qpostMessage(["buildComplete"]);
    return tMap;

}



var waveFunctionCollapse2 = function(mapWidth, mapHeight, adjacencyList, postMessage, mixes, notMixes){
    console.log(mixes);
    console.log(notMixes);
    var adjacencyDirections = [{x:-1,y:0},{x:0,y:-1},{x:1,y:0},{x:0,y:1}];

    console.log("wfn "+ mapWidth + " " + mapHeight);

    var genMapWidth = mapWidth;
    var genMapHeight = mapHeight;

    var tMap = {};

    var allOptions = [];
    for (const [key, value] of Object.entries(adjacencyList)) {
        allOptions.push(key);
    }
    var compare = function(a,b){
        return a.options.length - b.options.length;
    }
    var comparexy = function(a,b){
        return (a.options.y * genMapWidth + a.options.x) - (b.options.y * genMapWidth + b.options.x);
    }
    var pq = new PriorityQueue(comparexy);
    var aq = [];
    
    // initialize all RMM positions
    for (let h = 0; h < genMapHeight; h++) {
        for (let w = 0; w < genMapWidth; w++) {
            //var rmmBlock = this.gamemap.mapData[`${w}_${h}`];
            //var tileId = this.gamemap.tileTextureLookup[`${rmmBlock.tileFileNumber()}_${rmmBlock.tileIndexNumber()}`];

            var xyLookup = w + (h * genMapWidth);
            //var tileId = this.gamemap.tileLayer[xyLookup];
            var rmmTile = {x:w,y:h,options: [...allOptions], resolvedValue:-1, resolvedTileType:-1};
            tMap[xyLookup] = rmmTile;
            pq.push(rmmTile);
            aq.push(rmmTile);
        }
    }
    pq.push(tMap[0]);

    console.log("beginning pq " + pq.size());
    var cacheLite = {};
    var optionsHash = {};
    var candidate ={};
    var backtrackCount =0;
    var counter =0;
    var maxrollbacks =0;
    var maxCounter =1;
    var populateAll =-1;

    // initialize row+1 * col+1 positions
    // pick a tileset to initialize bottom left
    // pick either the same tileset or a matching tileset to be one next to it
    // for next row
    // pick a tileset that is either the # below, or the # below +1, if both are the same tileset, 
    TopLoop:
    while(building && (counter  < aq.length || counter < 0)){//!pq.isEmpty()){
        if(populateAll != -1){
            candidate = aq[counter];
            candidate.selected = populateAll;
            qpostMessage([counter,candidate.selected ]);
            counter++;
            continue;
        }
        //console.log("building");
        // start resolving shit using random
 
        /*
        var deque = [];
        while(!pq.isEmpty()){
            deque.push(pq.pop());
        }
        for(var i=0;i<deque.length;i++){
            pq.push(deque[i]);
        }
        */
        candidate = aq[counter];//pq.pop();    
        candidate.options = [];
        var leftTile = null;
        if(candidate.x >0){
            leftTile = aq[counter-1];
        }
        var downTile = null;
        if(candidate.y > 0){
            downTile = aq[counter-genMapWidth];
        }
        var downRightTile = null;
        if(candidate.y > 0 && candidate.x +1 <genMapWidth){
            downRightTile = aq[counter-genMapWidth + 1];
        }

        if(leftTile == null && downTile == null){
            // select a random non mixed tile
            var num = Object.entries(notMixes).length;
            var rand = Math.floor(num * Math.random());
            var selected = null;
            var tileSelect =0;
            for (const [key, value] of Object.entries(notMixes)) {
                if(rand == 0){
                    //var num2 = Object.entries(value).length;
                    //var rand2 = Math.floor(num * Math.random());
                    //for (const [key, value] of Object.entries(mixes)) {
                    //    if(rand2 == 0){
                            selected = value;
                    //        tileSelect = Math.floor(2 * Math.random());
                    //    }
                    //    rand2--;
                    //}
                }
                rand--;
            }
            
            //var selected = Object.entries(notMixes)[rand];
            console.log(selected);
            candidate.selected = MixedTileAdjacency.getTile(selected).item;
            console.log(candidate.selected);

            candidate.resolvedTileType = selected;
            //populateAll = candidate.selected;
            qpostMessage([counter,candidate.selected ]);
            counter++;
            continue;
        } else {
            //get permissable
            // identify if left and bottom have a common color, if so, other color is 2ndary
            // if left and bottom 2ndary mix is different check bottomright to see what options are available
            // if bottomright is D or E, this cna be K or L
            // if bottom right is A, this can only be L (most restrictive case)
            
            var leftBitmask = -1;
            var leftTileType = -1
            var leftMixedTileRef = null;
            var downMixedTileRef = null;
            var downBitmask = -1;
            var downTileType = -1
            
            var downRightMixedTileRef = null;
            var downRightBitmask = -1;
            var downRightTileType = -1
            var typesEnconuntered ={};

            if(leftTile != null){
                leftMixedTileRef = leftTile.resolvedTileType.tile;
                if(leftTile.resolvedTileType.tile.tile1 == "000"){
                    leftBitmask = 0b0000;
                    leftTileType = leftMixedTileRef.tile0; 
                } else {
                    // figure out what row was selected 
                    leftBitmask = MixedTileAdjacency.rowToBitmask(leftTile.resolvedTileType.row);
                    var testBitmask = leftBitmask + 0;
                    testBitmask ^= 0b0110;
                    if(leftBitmask & 0b0110 == 0b0110){
                        leftTileType = leftMixedTileRef.tile1;
                        typesEnconuntered[leftMixedTileRef.tile1] = 0;
                    } else if (testBitmask & 0b0110 == 0b0110){
                        leftTileType = leftMixedTileRef.tile0;
                        typesEnconuntered[leftMixedTileRef.tile0] = 0;
                    } else {
                        // we have a split not sure what to do yet
                        typesEnconuntered[leftMixedTileRef.tile0] = 0;
                        typesEnconuntered[leftMixedTileRef.tile1] = 0;
                    }
                }
            }
            if(downTile != null){
                downMixedTileRef = downTile.resolvedTileType.tile;
                if(downTile.resolvedTileType.tile.tile1 == "000"){
                    downBitmask = 0b0000;
                    downTileType = downMixedTileRef.tile0; 
                } else {
                    // figure out what row was selected 
                    downBitmask = MixedTileAdjacency.rowToBitmask(downTile.resolvedTileType.row);
                    var testBitmask = downBitmask + 0;
                    testBitmask ^= 0b0011;
                    if(downBitmask & 0b0011 == 0b0011){
                        downTileType = downMixedTileRef.tile1;
                        typesEnconuntered[downMixedTileRef.tile1] = 1;
                    } else if (testBitmask & 0b0011 == 0b0011){
                        downTileType = downMixedTileRef.tile0;
                        typesEnconuntered[downMixedTileRef.tile0] = 1;
                    } else {
                        // we have a split not sure what to do yet
                        typesEnconuntered[downMixedTileRef.tile0] = 1;
                        typesEnconuntered[downMixedTileRef.tile1] = 1;
                    }
                }
            }

            if(downRightTile != null){
                downRightMixedTileRef = downRightTile.resolvedTileType.tile;
                if(downRightTile.resolvedTileType.tile.tile1 == "000"){
                    downRightBitmask = 0b0000;
                    downRightTileType = downRightMixedTileRef.tile0; 
                } else {
                    // figure out what row was selected 
                    downRightBitmask = MixedTileAdjacency.rowToBitmask(downRightTile.resolvedTileType.row);
                    var testBitmask = downRightBitmask + 0;
                    testBitmask ^= 0b0011;
                    if(downBitmask & 0b0011 == 0b0011){
                        downTileType = downMixedTileRef.tile1;
                        typesEnconuntered[downMixedTileRef.tile1] = 2;
                    } else if (testBitmask & 0b0011 == 0b0011){
                        downTileType = downMixedTileRef.tile0;
                        typesEnconuntered[downMixedTileRef.tile0] = 2;
                    } else {
                        // we have a split not sure what to do yet
                        typesEnconuntered[downMixedTileRef.tile0] = 2;
                        typesEnconuntered[downMixedTileRef.tile1] = 2;
                    }
                }
            }
            // at most there can be 4 unique keys in typesEncountered.


            // actually start ealing with logic now

                if(downTile != null){
                    var downBitmask = -1
                    if(downTile.resolvedTileType.tile.tile1 == "000"){
                        downBitmask = 0b0000;
                    } else {

                    }

                    if(leftTile.resolvedTileType.tile.tile0 == downTile.resolvedTileType.tile.tile0){
                        // nonmixed til0 or can select mixed B "0010":1,
                        // or the 

                    } else if(downBitmask == -1 && leftTile.resolvedTileType.tile.tile0 == downTile.resolvedTileType.tile.tile1){

                    }else if(leftBitmask == -1 && leftTile.resolvedTileType.tile.tile1 == downTile.resolvedTileType.tile.tile0){

                    }else if(downBitmask == -1 && leftBitmask == -1 && leftTile.resolvedTileType.tile.tile1 == downTile.resolvedTileType.tile.tile1){

                    } else {
                        console.log("critical failure");
                        console.log(leftTile.resolvedTileType);
                        console.log(downTile.resolvedTileType);
                        console.log(mixes);
                        eafae.faef.ae.fae.f;
                    }
                    
                } else {

                }
           
        }
        
        var rightTile = null;
        var upTile = null;

        //if(candidate.resolvedValue != -1) continue;      
        if(candidate.options.length == 0){
            //console.log(adjacencyList[aq[counter -1].resolvedValue].neighbors[2]);
            //console.log(adjacencyList[aq[counter -genMapWidth].resolvedValue].neighbors[1]);

            var leftItem = -1; 
            if(counter -1 >= 0) leftItem = aq[counter -1].resolvedValue;
            var bottomItem =-1;
            if(counter - genMapWidth >= 0) bottomItem = aq[counter -genMapWidth].resolvedValue;

            
            var nOptions = [];
            if(!optionsHash[`${leftItem}_${bottomItem}`]){
                var l1;
                var l2;
                if(leftItem != -1 ){
                    l1 = Object.keys(adjacencyList[aq[counter -1].resolvedValue].neighbors[2]);
                } else {
                    l1 = [...allOptions];
                }
                if(bottomItem != -1){
                    l2 = Object.keys(adjacencyList[aq[counter -genMapWidth].resolvedValue].neighbors[3]);
                } else {
                    l2 = [...allOptions];
                }

                for (var i=0;i<l1.length;i++) {
                    for (var j=0;j<l2.length;j++) {
                        if(l1[i] == l2[j]){
                            //console.log("valid location " +l1[i]);
                            nOptions.push(l1[i]);
                            break;
                        }
                    }
                }
                optionsHash[`${leftItem}_${bottomItem}`] = [...nOptions];
            } else {
                nOptions = optionsHash[`${leftItem}_${bottomItem}`];
            }
            candidate.options = [...nOptions];
            if(candidate.options.length ==0) 
            {

                candidate.resolvedValue=-1;
                maxCounter = (maxCounter+1) % (genMapWidth * genMapWidth * 5);
                if(maxCounter ==0){
                    maxrollbacks++;

                    let rollbackQty = genMapWidth;
                    if(maxrollbacks > 100){
                        rollbackQty=  genMapWidth*2;
                        maxrollbacks=0;
                    }

                    counter= counter -rollbackQty;
                    //var delta =0;
                    if(counter < 0){
                        counter =0;
                    //    delta = counter * -1;
                    //    counter = 0;
                    }
                    for(var i=0;i<rollbackQty;i++){
                        if(aq[counter +i])
                            aq[counter +i].resolvedValue = -1;
                        //qpostMessage([counter + i,-1 ]);
                    }
                    rollbackQty = genMapWidth;
                }else {
                    counter-=1;
                    for(var i=0;i<1;i++){
                        aq[counter +i].resolvedValue = -1;
                        //qpostMessage([counter + i,-1 ]);
                    }
                }
                continue;
            }
            // select a random option

            //console.log(aq[-1].eaifje.eafeaf);
            /*
            counter++;
            continue;
            //rewind row
            var row = parseInt(counter / genMapWidth);
            var col = counter % genMapWidth;
            var offset = Math.round(row * genMapWidth);
            if(maxrollbacks > 10 && row > 1){
                for(var i=0;i<=col;i++){
                    aq[offset + i].options = [...allOptions];
                    aq[offset + i].resolvedValue = -1;
                    postMessage([offset + i,-1 ]);
                }
                var row = row-1;
                offset = Math.round(row * genMapWidth);
                for(var i=0;i<genMapWidth;i++){
                    aq[offset + i].options = Object.keys(adjacencyList[aq[offset+i-genMapWidth].resolvedValue].neighbors[3]);
                    aq[offset + i].resolvedValue = -1;
                    postMessage([offset + i,-1 ]);
                }
                maxrollbacks=0;
                counter = offset;
                console.log("double rollback");
            }
            else {
                for(var i=0;i<=col;i++){
                    aq[offset + i].options = Object.keys(adjacencyList[aq[offset+i-genMapWidth].resolvedValue].neighbors[3]);
                    aq[offset + i].resolvedValue = -1;
                    postMessage([offset + i,-1 ]);
                }
                
                //console.log("epic fail " + counter);
                //counter = counter - genMapWidth;
                counter = offset;
                maxrollbacks++;
            }
            continue;
            */
        }
        var roll = Math.random();
        var selectionIndex = Math.floor(roll * candidate.options.length);
        var selectionItem = candidate.options[selectionIndex];

        candidate.resolvedValue = selectionItem;
        var preRemove = candidate.options;
        candidate.options = candidate.options.splice(selectionIndex,1);// = [selectionItem];
        var candidatexyLookup = candidate.x + (candidate.y * genMapWidth);
        tMap[candidatexyLookup] = candidate;
        var txcandidatexyLookup = candidatexyLookup + "";// + 0;
        var txselection = selectionItem + "";// + 0;
        qpostMessage([txcandidatexyLookup,txselection ]);
        counter++;
        continue;
        // update all neighbors
        var preModOptions = [[],[],[],[]];
        for(var x=0;x<adjacencyDirections.length;x++){
            var tarx = candidate.x + adjacencyDirections[x].x;
            var tary = candidate.y + adjacencyDirections[x].y;
            if(tarx >=0 && tary >=0 && tarx < genMapWidth && tary < genMapHeight){
                //var tarTile = ;//map.tileLayer[tarx + (tary * map.tilesAcross)];
                var tarxyLookup = tarx + (tary * genMapWidth);//tarTile.x + (tarTile.y * map.tilesAcross);
                //console.log(tarx + " " +tary + " " + tarxyLookup);
                preModOptions[x] = tMap[tarxyLookup].options;
                if(tMap[tarxyLookup].resolvedValue == -1){
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
                        for (const [key, value] of Object.entries(adjacencyList)) {
                            for (const [key2, value2] of Object.entries(adjacencyList[key].neighbors[invNeighbor])) {
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
                    var filteredArray = tMap[tarxyLookup].options.filter(function(n) {
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
                        tMap[tarxyLookup].options=filteredArray;

                    }else {
                        tMap[tarxyLookup].options=filteredArray;
                    }
                    //pq.push(tMap[tarxyLookup]);
                    if(tMap[tarxyLookup].resolvedValue == -1) pq.push(tMap[tarxyLookup]);
                }
            }
        }
        backtrackCount =0;
        counter++;
    }
    console.log("finished generating map");
    console.log(tMap);
    qpostMessage(["buildComplete"]);
    return tMap;
}


onmessage = function(e) {
    if(e.data[0] == "buildTextureAtlas"){
        console.log('Message received from main script');
        building=true;
        var tileTextureMap = waveFunctionCollapse(e.data[1],e.data[1],e.data[2],  postMessage, e.data[3], e.data[4]);
    }
    if(e.data[0] == "stopBuildTextureAtlas"){
        console.log('Stop Message received from main script');
        building=false;
    }
}