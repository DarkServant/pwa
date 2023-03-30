
const WALL = 1;
const FLOOR = 0;



function setAll(a, v, length) {
    var i, n = length || a.length; 
    for (i = 0; i < n; ++i) {
        a[i] = v;
    }
}

function roomIndexToMapIndix(mapObject, roomObject, perimeterIndex, thicknessIndex, advance){
    var extra = advance || 0;
    var wallThickness = roomObject.wallThickness;
    var mapX;
    var mapY;
    var side =-1;
    var width = roomObject.width;
    var height = roomObject.height;
    var roomSideWidth = width - wallThickness;
    var roomSideHeight =  height - wallThickness;

    var lookup = (perimeterIndex  + advance) % (roomSideWidth*2 + roomSideHeight*2);

    if(lookup < roomSideWidth){
        side = 0;
        mapX = roomObject.x + lookup;
        mapY = roomObject.y + thicknessIndex;
    }else if (lookup >= roomSideWidth && lookup < roomSideWidth + roomSideHeight){
        side = 1;
        mapX = roomObject.x + roomSideWidth + thicknessIndex;
        mapY = roomObject.y + lookup - roomSideWidth;
    }else if (lookup >= roomSideWidth + roomSideHeight && lookup < (roomSideWidth)*2 + roomSideHeight){
        side = 2;
        mapX = roomObject.x + width - (lookup - roomSideWidth - roomSideHeight) ;
        mapY = roomObject.y + roomSideHeight + thicknessIndex;
    } else {
        side = 3;
        mapX = roomObject.x + thicknessIndex ;
        mapY = roomObject.y + height - (lookup - roomSideWidth*2 - roomSideHeight);
    }
    return {index:mapObject.width * mapY + mapX, side:side};
}


function cutWall(mapObject, roomObject){
    var wallThickness = roomObject.wallThickness;
    var minHallwayDistance = roomObject.minHallwayDistance;
    var hallwayVariance = roomObject.hallwayVariance;

    var width = roomObject.width;
    var height = roomObject.height;

    var nonCornerIndices = (width - wallThickness*2)*2 + (height - wallThickness*2)*2;
    var beginIndex = Math.floor(Math.random() * nonCornerIndices);
    var hallLength = Math.floor((Math.random()-.5)*hallwayVariance) + minHallwayDistance;
    roomObject.hallways.push({start:beginIndex, end:beginIndex + hallLength});

    var side =-1;
    for(var i=0;i<=hallLength;i++){
        for(var j=0;j<wallThickness;j++){
            var mapIndex = roomIndexToMapIndix(mapObject,roomObject, beginIndex, j, i);
        }
        mapObject.data[mapIndex.index] = FLOOR;
    }
    return;
}

function makeRoom(mapObject, roomSize, wallThickness, minHallwayDistance, hallwayVariance){
    var x = Math.floor((Math.random() * (mapObject.width - roomSize)));
    var y = Math.floor((Math.random() * (mapObject.height - roomSize)));
    var width = Math.floor((Math.random() * (roomSize * .5)));
    var height = Math.floor((Math.random() * (roomSize * .5)));
    width = Math.floor(roomSize*.75 + width);
    height = Math.floor(roomSize*.75 + height);

    var doorWayProbability = [0,.3,.4,.95];
    var openingRoll = Math.random();
    var numOpenings =0;
    for(var i=doorWayProbability.length-1;i>=0;i--){
        if(openingRoll >= doorWayProbability[i])
        numOpenings = i+1;
    }

    
    // make a room not caring if a room already exists
    for(var i =0;i<height;i++){
        for (var j=0;j<width;j++){
            var isWall=false;
            if(i < wallThickness || i >= (height - wallThickness) || j < wallThickness || j >= (width - wallThickness)) {
                isWall =true;
            }
            mapObject.data[(y+i)*mapObject.width + (j + x)] = isWall ? WALL : FLOOR;
        }
    }
    
    var roomObject = {x:x, y:y, width:width, height:height, wallThickness: wallThickness,minHallwayDistance: minHallwayDistance, hallwayVariance: hallwayVariance, hallways:[], numOpenings:numOpenings };

    return roomObject;
}

var generateMapFunction = function(mapObject, generationOptions){
    if(!mapObject) return;

    const wallThickness = 1;
    const minHallwayDistance = 4;
    const hallwayVariance = 2;
    
    var roomCount = [];
    var roomSize = [21,14,7];
    roomCount[0] = generationOptions.largeRoomCount || 1;
    roomCount[1] = generationOptions.mediumRoomCount || 1;
    roomCount[2] = generationOptions.smallRoomCount || 1;

    var rooms = [];
    for(var i=0;i<roomCount.length;i++){
        for(var j=0;j<roomCount[i];j++){
            var room = makeRoom(mapObject, roomSize[i], wallThickness, minHallwayDistance,hallwayVariance);
            rooms.push(room);
        }
    }
    
    for(var i=0;i<rooms.length;i++){
        for(var j=0;j<rooms[i].numOpenings;j++){
            cutWall(mapObject, rooms[i]);
        }
    }

}


var createMapFunction = function(width,height){
    var ret = {width:width, height:height, data: []}
    setAll(ret.data,FLOOR,width*height);
    return ret;
}


var GameMap = {
    createMap : createMapFunction,
    generateMap: generateMapFunction,
    WALL : WALL,
    FLOOR: FLOOR
}

export {GameMap};