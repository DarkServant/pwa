import {GameMap} from "./gamemap.js";
import {AssetManager} from "./assetManager.js";
import {DataParser, MixedTileAdjacency} from "./dataparser.js";


console.log(GameMap);
const canvas = document.getElementById("mainviewport");
const gl = canvas.getContext('webgl2');

const container = document.getElementById("rightcontainer");

var shaderProgram;
var lastposy = false;
var lastposx = false;
var flag = 0;
var mapSize = 50;
var cameraOffset = { x: 0, y: mapSize/-2.2 };
var cameraZoom = mapSize/(16+ 2/3);
var cameraRotate = [0, 0, 0];
var imageIndex =0;
var wallHeight = 10;
var offsets = [[0,0]];//,[5,0],[-5,0],[0,5],[0,-5]];
var dp = new DataParser();

function resizeCanvas() {
    var width = container.offsetWidth;
    var height = container.offsetHeight;
    gl.viewportWidth = width;
    gl.viewportHeight = height;
    if (true || canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
    console.log("resize");
}

var render = function () {
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 1);  
    gl.disable(gl.SCISSOR_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(1, 1, canvas.width - 2, canvas.height - 2);
    gl.clearColor(0, 0, 0, 1);  
    gl.clear(gl.COLOR_BUFFER_BIT);
};


window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', function (evt) { 
    if ( flag ==1) {
        cameraOffset.x -= lastposx - evt.pageX;
        cameraOffset.y += lastposy - evt.pageY;
    }
    lastposx = evt.pageX;
    lastposy = evt.pageY;
});
canvas.addEventListener('mousedown', function (evt) { 
    cameraOffset.x += lastposx - evt.pageX;
    cameraOffset.y += lastposy - evt.pageY;
    //console.log(cameraOffset.x + ", " +cameraOffset.y);
    flag = 1;
});
window.addEventListener('mouseup', function (evt) { 
    flag = 0;
});

if (window.addEventListener) {
    // IE9, Chrome, Safari, Opera
    window.addEventListener("mousewheel", MouseWheelHandler, false);
    // Firefox
    window.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
}
// IE 6/7/8
else window.attachEvent("onmousewheel", MouseWheelHandler);
function MouseWheelHandler(e) {
    
    // cross-browser wheel delta
    var e = window.event || e; // old IE support
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    cameraZoom = Math.max(0, delta*-.1  + cameraZoom);
    //console.log(cameraZoom + " " + delta);
}

await webGLStart();

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    //gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    texture.loaded = true;
    console.log("loaded");
}

var myTexture ;
function prepareTexture(texture) {
    if(!myTexture)
        myTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, myTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //gl.enableVertexAttribArray(vloc);
    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
    //gl.vertexAttribPointer(vloc, 2, gl.FLOAT, false, 0, 0);

    //gl.enableVertexAttribArray(tloc);
    //gl.bindBuffer(gl.ARRAY_BUFFER, texBuff);
    //gl.vertexAttribPointer(tloc, 2, gl.FLOAT, false, 0, 0);
}


function initTextureFromArray(buffer){
    prepareTexture(myTexture);        

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, buffer.width, buffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(buffer.data.buffer));
    gl.bindTexture(gl.TEXTURE_2D, null);

    myTexture.loaded=true;

}
async function initTexture(imageUrl) {
    prepareTexture(myTexture);
    
    const blob = await fetch(imageUrl).then(res => res.blob());
    let start = performance.now();
    let now;
    createImageBitmap(blob).then(bitmap => {
        now = performance.now();
        console.log('createImageBitmap promise elapsed time', now - start);
        start = now;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        gl.bindTexture(gl.TEXTURE_2D, null);
        console.log('texImage2D elapsed time', performance.now() - start);
        console.log(bitmap.width + ", " + bitmap.height);
        myTexture.loaded=true;
        //draw();
    });
    now = performance.now();
    console.log('createImageBitmap elapsed time', now - start);
    start = now;

    //myTexture = gl.createTexture();
    //myTexture.image = new Image();
    //myTexture.image.onload = function () {
    //    handleLoadedTexture(myTexture);
    //}
    //myTexture.image.src = "images/galaxy.png";
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvMatrixStack = [];

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "ya 3am mesh pop";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setUniforms() {
    //pMatrix = mat4.create();
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var script = shaderScript.firstChild;
    while (script) {
        if (script.nodeType == 3) {
            str += script.textContent;
        }
        script = script.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    var fragementShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragementShader);
    
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("cloud not initialise shaders");
        alert("cloud not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexColorAttribute=gl.getAttribLocation(shaderProgram,"aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    shaderProgram.textureCoordsAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordsAttribute);
    
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndicesBuffer;
var cubeVertexTextureCoordBuffer;

function initBuffer() {
    var redo = false;
    if(cubeVertexColorBuffer){
        redo = true;
        gl.deleteBuffer(cubeVertexPositionBuffer);
        gl.deleteBuffer(cubeVertexColorBuffer);
        gl.deleteBuffer(cubeVertexIndicesBuffer);
        gl.deleteBuffer(cubeVertexTextureCoordBuffer);
    }
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var geometry = buildGeometryFromMap();
    var vertices = geometry.vertices;
    var colors = geometry.colors;
    var indices = geometry.indices;
    var textureCoords = geometry.textureCoords;
    /*
    vertices = [
// Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

// Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

// Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

// Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

// Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

// Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];
    */
    //if(redo){
    //    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
    //} else {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    //}
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = vertices.length;
    
    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    /*
    var colors = [
        [1.0, 0.0, 0.0, 1.0], // Front face
        [1.0, 1.0, 0.0, 1.0], // Back face
        [0.0, 1.0, 0.0, 1.0], // Top face
        [1.0, 0.5, 0.5, 1.0], // Bottom face
        [1.0, 0.0, 1.0, 1.0], // Right face
        [0.0, 0.0, 1.0, 1.0]  // Left face
    ];
    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4 ; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    */
    //if(redo){
    //    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(colors));
    //} else {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    //}
    cubeVertexColorBuffer.itemSize = 4;
    cubeVertexColorBuffer.numItems = colors.length;
    
    cubeVertexIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndicesBuffer);
    /*
    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);*/
    
    //if(redo){
    //    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint32Array(indices));
    //} else {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    //}
    cubeVertexIndicesBuffer.itemSize = 1;
    cubeVertexIndicesBuffer.numItems = indices.length;
    
    
    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    /*
    var textureCoords = [
// Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

// Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

// Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

// Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

// Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

// Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    */    
    //if(redo){
    //    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint32Array(textureCoords));
    //} else {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    //}
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = textureCoords.length;

}
function degree_to_redian(degree) {
    return degree * Math.PI / 180.0;
}

//var offsets = [[mapSize/2,mapSize/2]];//,[5,0],[-5,0],[0,5],[0,-5]];
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!myTexture || !myTexture.loaded) return;
    mat4.perspective(pMatrix,45, gl.viewportWidth / gl.viewportHeight, 0.1, 10000.0);
    //mat4.ortho(pMatrix, -25.0, 25.0, -25.0, 25.0, -25.0, 25.0);
    //mvMatrix = mat4.create();
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [cameraOffset.x - 100, cameraOffset.y + 120, -5.0 * cameraZoom]);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, 60.0 ]);
    mat4.rotate(mvMatrix, mvMatrix, degree_to_redian(-35.264 +180), [1.0, 0.0, 0.0]);
    mat4.rotate(mvMatrix, mvMatrix, degree_to_redian(45 +180), [0.0, 0.0, 1.0]);
    //mat4.translate(mvMatrix, mvMatrix, [-15,-15, 0]);
    //mat4.rotate(mvMatrix, mvMatrix, degree_to_redian(rTri), [0.0, 0.0, 1.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordsAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, myTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    
     gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexColorBuffer);
     gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,cubeVertexColorBuffer.itemSize,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndicesBuffer);
    for (var i = 0; i < offsets.length; i++) {
        //console.log(offsets[i].length);
        mat4.translate(mvMatrix, mvMatrix, [offsets[i][0], offsets[i][1], 0]);
        mat4.rotate(mvMatrix, mvMatrix, degree_to_redian(rTri), [0.0, 0.0, 1.0])
        setUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndicesBuffer.numItems, gl.UNSIGNED_INT, 0);
        mat4.rotate(mvMatrix, mvMatrix, degree_to_redian(rTri), [0.0, 0.0, -1.0])
        mat4.translate(mvMatrix, mvMatrix, [-offsets[i][0], -offsets[i][1], 0]);
    }
    //gl.drawArrays(gl.TRIANGLES_STRIPS,0,cubeVertexPositionBuffer.numItems);
}

var floorTileTextureInfo = {tileTextureMap:{}};

var callOnce =0;
var texCall =0;
var mapTex = function(e,textureCoordMap,maxAtlas,atlasWidth,atlasHeight) {

    // update texture coordinates
    //if(!floorTileTextureInfo) console.log("nope");
    //if(!floorTileTextureInfo.tileTextureMap) floorTileTextureInfo.tileTextureMap= {};
    for(const [key,value] of Object.entries(e[0])){
        floorTileTextureInfo.tileTextureMap[key] = value;
        
    }
    updateMapTex(textureCoordMap,maxAtlas,atlasWidth,atlasHeight);
    texCall++;
    //floorTileTextureInfo.tileTextureMap[e[0]] = e[1];
    if(texCall > mapSize * 100000){
        texCall =0;
    }
}

var updateMapTex = function(textureCoordMap,maxAtlas,atlasWidth,atlasHeight){
    //console.log("updateMapTex");
    var textureCoords = [];
    var atlasPad = 2.0;
    var debugTex = false;
    //if(!floorTileTextureInfo) console.log("nope");
    //if(!floorTileTextureInfo.tileTextureMap) floorTileTextureInfo.tileTextureMap= {};
    floorTileTextureInfo.textureCoordMap =textureCoordMap;
    floorTileTextureInfo.maxAtlas = maxAtlas;
    floorTileTextureInfo.atlasWidth = atlasWidth;
    floorTileTextureInfo.atlasHeight = atlasHeight;
    if(callOnce  >5){
        //return;
    } else {
    //console.log(floorTileTextureInfo.tileTextureMap);
    //console.log(floorTileTextureInfo.textureCoordMap);
    //console.log(atlasWidth);
    //console.log(atlasHeight);
    }

    callOnce++;

    for(var i=0;i<gameMapObject.height;i++){
        for(var j=0;j<gameMapObject.width;j++){
            var xTexCoord;
            var yTexCoord ;
            var xTexCoordWidth ;
            var yTexCoordHeight;
            var xTexCoord2 ;
            var yTexCoord2;

            var xyLookup = j + (i * mapSize);
            var tileKind = floorTileTextureInfo.tileTextureMap[xyLookup];
            if( tileKind === undefined || tileKind == -1){ 
                
                xTexCoord = .99;
                yTexCoord = .98;
                xTexCoord2 = 1.0;
                yTexCoord2 = 1.0;

            } else {
                //if(tileKind < Object.keys(floorTileTextureInfo.textureCoordMap).length /7 ) tileKind=1;
                //console.log(tileKind);
                //console.log(xyLookup);
                var atlasPosition = floorTileTextureInfo.textureCoordMap[tileKind];
                if(!atlasPosition) {
                    atlasPosition = floorTileTextureInfo.textureCoordMap[1];
                    console.log("miss " + tileKind);
                    //console.log(floorTileTextureInfo.textureCoordMap);
                    xTexCoord = .99;
                    yTexCoord = .98;
                    xTexCoord2 = 1.0;
                    yTexCoord2 = 1.0;
                    //.log(atlasPosition);
                } else {
    
                //var xTexCoord = (((48.0+atlasPad*2) * atlasPosition.x) + atlasPad) / floorTileTextureInfo.atlasWidth ;
                //var yTexCoord = (((24.0+atlasPad*2) * atlasPosition.y) + atlasPad) / floorTileTextureInfo.atlasHeight ;
                xTexCoord = atlasPosition.x + atlasPad / floorTileTextureInfo.atlasWidth ;
                yTexCoord = atlasPosition.y + atlasPad / floorTileTextureInfo.atlasHeight ;
                xTexCoordWidth = 48.0 / floorTileTextureInfo.atlasWidth;
                yTexCoordHeight = 24.0 / floorTileTextureInfo.atlasHeight;
                xTexCoord2 = xTexCoord + xTexCoordWidth;
                yTexCoord2 = yTexCoord + yTexCoordHeight;
                if(atlasPosition.x >= (floorTileTextureInfo.maxAtlas.x) && atlasPosition.y >=floorTileTextureInfo.maxAtlas.y ){
                    
                    console.log("gooooal " +xTexCoord + " " + yTexCoord + " " + xTexCoord2 + " " + yTexCoord2);
                    console.log( (((48.0+atlasPad*2) * atlasPosition.x) + atlasPad) + " " + floorTileTextureInfo.atlasWidth + " " + atlasPosition.x);
                    //console.log("fucked " + AssetManager.reverseVirtualTileDictionary.length + " " + tileKind);
    
                }
            }
            }
        textureCoords.push(
            xTexCoord, 1.0-yTexCoord,
            xTexCoord2, 1.0-yTexCoord,
            xTexCoord2,1.0-yTexCoord2,
            xTexCoord, 1.0-yTexCoord2,);
        }
    }

    //buffer texture coords;

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(textureCoords));//, gl.STATIC_DRAW);
    if(buildComplete) return;
    setTimeout(()=>{updateMapTex(textureCoordMap,maxAtlas,atlasWidth,atlasHeight);},mapSize/8);
  }
  var mapGenWorker ;
  var floorTex ;
  var buildComplete = false;

  var curMapNumber = "Map00072.rmm";
async function webGLStart() {
    curMapNumber = "Map00037.rmm";
    mvMatrix = mat4.create();
    pMatrix = mat4.create();
    resizeCanvas();
    initShaders();
    //console.log("what the fuckkkk");
    await dp.init();
    await dp.readmap(curMapNumber);
    await dp.buildAdjacencyList();
    //dp.buildObjectAdjacencyList();
    mapSize=50;
    //console.log("calling wfn " + mapSize);
    floorTex = dp.buildTextureAtlas();
    initTextureFromArray(floorTex);
    var buildTextureAtlasData = { };
    
    //var tileTextureMap = dp.waveFunctionCollapse(mapSize,mapSize);
    floorTileTextureInfo = {mixes: dp.mixes, notMixes: dp.notMixes, tileTextureMap: {}, atlasWidth: floorTex.width, atlasHeight: floorTex.height, textureCoordMap: floorTex.textureCoordMap, maxAtlas: floorTex.maxAtlas};
    mapGenWorker = new Worker('js/mapgen.js', { type: "module" });
    mapGenWorker.onmessage = (event) => {
        console.log("got message " + event.data.length + " " + event.data[0]);
        console.log(event);
        if(event.data[0] == "buildComplete"){
            buildComplete=true;
        }else {
            mapTex(event.data,floorTex.textureCoordMap,floorTex.maxAtlas,floorTex.width,floorTex.height);
        }
    };
    
    initGameMap();    
    //initTexture("images/galaxy.png");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST)
    drawScene();
    tick();




    //mapGenWorker.postMessage(["buildTextureAtlas",  mapSize, dp.adjacencyList]);

    //changeImage();
}
function centerCamera(){
    cameraOffset = { x: mapSize*.95, y: mapSize/-1.3 };
    cameraZoom = mapSize/(4+ 1/3);

}

var gameMapObject ;
function initGameMap(){
    regenerateGameMap();
}

function regenerateGameMap(large,medium,small){
    gameMapObject = GameMap.createMap(mapSize,mapSize);
    var generationOptions = {largeRoomCount : large || 12, mediumRoomCount: medium || 20, smallRoomCount:small || 6}; 
    GameMap.generateMap(gameMapObject,generationOptions);
    initBuffer();
    mapGenWorker.postMessage(["buildTextureAtlas",  mapSize, dp.adjacencyList, dp.mixes, dp.notMixes]);
    buildComplete = false;
    setTimeout(()=>{updateMapTex(floorTex.textureCoordMap,floorTex.maxAtlas,floorTex.width,floorTex.height);},1);
    centerCamera();
}

function buildGeometryFromMap(){
    var vertices = [];
    var colors = [];
    var indices = [];
    var textureCoords = [];
    var idxctr=0;
    var ctr =0;
    var atlasPad = 2.0;
    var debugTex = false;

    //console.log(floorTileTextureInfo.tileTextureMap);
    //console.log(floorTileTextureInfo.textureCoordMap);
    for(var i=0;i<gameMapObject.height;i++){
        for(var j=0;j<gameMapObject.width;j++){
            var xTexCoord;
            var yTexCoord ;
            var xTexCoordWidth ;
            var yTexCoordHeight;
            var xTexCoord2 ;
            var yTexCoord2;
            if(!debugTex){
            var xyLookup = j + (i * mapSize);

            var tileKind = -1;
            if(floorTileTextureInfo.tileTextureMap[xyLookup])
                tileKind = floorTileTextureInfo.tileTextureMap[xyLookup].resolvedValue;
            if( tileKind === undefined || tileKind == -1){ 
                
                xTexCoord = .99;
                yTexCoord = .96;
                xTexCoord2 = 1.0;
                yTexCoord2 = 1.0;

            } else {
                //if(tileKind < Object.keys(floorTileTextureInfo.textureCoordMap).length /7 ) tileKind=1;
                console.log(tileKind);
                console.log(xyLookup);
                var atlasPosition = floorTileTextureInfo.textureCoordMap[tileKind];
                if(!atlasPosition) atlasPosition = floorTileTextureInfo.textureCoordMap[1];
                console.log(atlasPosition);
    
                //var xTexCoord = (((48.0+atlasPad*2) * atlasPosition.x) + atlasPad) / floorTileTextureInfo.atlasWidth ;
                //var yTexCoord = (((24.0+atlasPad*2) * atlasPosition.y) + atlasPad) / floorTileTextureInfo.atlasHeight ;
                xTexCoord = atlasPosition.x + atlasPad / floorTileTextureInfo.atlasWidth ;
                yTexCoord = atlasPosition.y + atlasPad / floorTileTextureInfo.atlasHeight ;
                xTexCoordWidth = 48.0 / floorTileTextureInfo.atlasWidth;
                yTexCoordHeight = 24.0 / floorTileTextureInfo.atlasHeight;
                xTexCoord2 = xTexCoord + xTexCoordWidth;
                yTexCoord2 = yTexCoord + yTexCoordHeight;
                if(atlasPosition.x >= (floorTileTextureInfo.maxAtlas.x) && atlasPosition.y >=floorTileTextureInfo.maxAtlas.y ){
                    
                    console.log("gooooal " +xTexCoord + " " + yTexCoord + " " + xTexCoord2 + " " + yTexCoord2);
                    console.log( (((48.0+atlasPad*2) * atlasPosition.x) + atlasPad) + " " + floorTileTextureInfo.atlasWidth + " " + atlasPosition.x);
                    //console.log("fucked " + AssetManager.reverseVirtualTileDictionary.length + " " + tileKind);
    
                }
            }
            textureCoords.push(
                xTexCoord, 1.0-yTexCoord,
                xTexCoord2, 1.0-yTexCoord,
                xTexCoord2,1.0-yTexCoord2,
                xTexCoord, 1.0-yTexCoord2,);
            }


    
            if(debugTex){
            var pxtc = j*1.0 / gameMapObject.width;
            var pytc = i*1.0 / gameMapObject.height;
            var xxtc = (j+1)*1.0 / gameMapObject.width;
            var yytc = (i+1)*1.0 / gameMapObject.height;
            //console.log(xTexCoord + " " + yTexCoord + " " + xTexCoord2 + " " + yTexCoord2);
            
            
            textureCoords.push(
                pxtc, pytc,
                xxtc, pytc,
                xxtc,yytc,
                pxtc, yytc,);
            }

        }
    }
    

    //console.log(gameMapObject);
    for(var i=0;i<gameMapObject.height;i++){
        for(var j=0;j<gameMapObject.width;j++){
            if(true){//gameMapObject.data[ctr] == 0){
                // Top face
                if(!debugTex){
                vertices.push(
                2*(j+0.0), i+0.0, 100.0,
                2*(j+1.0), i+0.0, 100.0,
                2*(j+1.0), i+1.0, 100.0,
                2*(j+0.0), i+1.0, 100.0);
            }
            if(debugTex){
                vertices.push(
                22*(j+0.0), i+0.0, 1.0,
                22*(j+1.0), i+0.0, 1.0,
                22*(j+1.0), i+1.0, 1.0,
                22*(j+0.0), i+1.0, 1.0);
            }
/*
                j+-1.0, i+1.0, -1.0,
                j+-1.0, i+1.0, 1.0,
                j+1.0, i+1.0, 1.0,
                j+1.0, i+1.0, -1.0);*/

                indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                idxctr+=4;

                for(var k=0;k<4;k++)
                    colors.push(0.0, 1.0, 0.0, 1.0); // Top face
/*
                textureCoords.push(
                    0.0, 0.0,
                    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0,);*/
            } else {
                // front face
                vertices.push(
                    j+0.0, i+0.0, wallHeight,
                    j+1.0, i+0.0, wallHeight,
                    j+1.0, i+1.0, wallHeight,
                    j+0.0, i+1.0, wallHeight);
                    /*
                j+-1.0, i+1.0, -1.0,
                j+-1.0, i+1.0, 1.0,
                j+1.0, i+1.0, 1.0,
                j+1.0, i+1.0, -1.0);
*/
                indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                idxctr+=4;

                for(var k=0;k<4;k++)
                    colors.push(1.0, 0.0, 0.0, 1.0); // Top face
                
                textureCoords.push(
                    0.0, 0.0,
                    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0,);

                if(j ==0 || gameMapObject.data[gameMapObject.width * i + j -1] == 0){
                    // build left wall
                    vertices.push(
                        j+0.0, i+0.0, 0,
                        j+0.0, i+0.0, wallHeight,
                        j+0.0, i+1.0, wallHeight,
                        j+0.0, i+1.0, 0);

                    indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                    idxctr+=4;

                    textureCoords.push(        
                        0.0, 0.0,
                        1.0, 0.0,
                        1.0, 1.0,
                        0.0, 1.0,);

                    for(var k=0;k<4;k++)
                        colors.push(1.0, 0.0, 1.0, 1.0);

                }
                
                if(i ==0 || gameMapObject.data[gameMapObject.width * (i-1) + j] == 0){
                    // build down  wall
                    vertices.push(
                        j+0.0, i+0, 0,
                        j+1.0, i+0, 0,
                        j+1.0, i+0, wallHeight,
                        j+0.0, i+0, wallHeight);

                    indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                    idxctr+=4;

                    textureCoords.push(        
                        1.0, 1.0,
                        0.0, 1.0,
                        0.0, 0.0,
                        1.0, 0.0,);

                    for(var k=0;k<4;k++)
                        colors.push(0.0, 1.0, 1.0, 1.0);

                }
                if(j == gameMapObject.width-1 || gameMapObject.data[gameMapObject.width * i + j+1] == 0){
                    // build right wall
                    vertices.push(
                        j+1.0, i+0, 0,
                        j+1.0, i+1.0, 0,
                        j+1.0, i+1.0, wallHeight,
                        j+1.0, i+0, wallHeight);

                    indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                    idxctr+=4;

                    textureCoords.push(
                        1.0, 0.0,
                        1.0, 1.0,
                        0.0, 1.0,
                        0.0, 0.0,);

                    for(var k=0;k<4;k++)
                        colors.push(0.0, 0.0, 1.0, 1.0);

                }
                if(i == gameMapObject.height -1 || gameMapObject.data[gameMapObject.width * (i+1) + j] == 0){
                    // build up  wall
                    vertices.push(
                        j+0.0, i+1.0, 0,
                        j+0.0, i+1.0, wallHeight,
                        j+1.0, i+1.0, wallHeight,
                        j+1.0, i+1.0, 0);

                    indices.push(idxctr+0, idxctr+1, idxctr+2, idxctr+0, idxctr+2, idxctr+3);
                    idxctr+=4;

                    textureCoords.push(
                        0.0, 1.0,
                        0.0, 0.0,
                        1.0, 0.0,
                        1.0, 1.0,);

                    for(var k=0;k<4;k++)
                        colors.push(1.0, 1.0, 0.0, 1.0);
                        
                }


            }
            ctr++;
        }
    }
    return {vertices: vertices, colors:colors, indices:indices, textureCoords:textureCoords};
}

function changeImage(){
    initTexture("images/" + imageIndex + "_layer_16_uniquemegaatlas.bmp");
    imageIndex++;
    if (imageIndex >= 9)
        imageIndex =0; 
    setTimeout(changeImage, 100);
}

var rTri = 180 - 45;
var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        
        //rTri += (90 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}


async function makeMap(mapNum){
    if(mapNum != curMapNumber){
        await dp.readmap(mapNum);
        await dp.buildAdjacencyList();

        floorTex = dp.buildTextureAtlas();
        initTextureFromArray(floorTex);
        floorTileTextureInfo.tileTextureMap = {};
        floorTileTextureInfo.atlasWidth = floorTex.width;
        floorTileTextureInfo.atlasHeight = floorTex.height;
        floorTileTextureInfo.textureCoordMap = floorTex.textureCoordMap;
        floorTileTextureInfo.maxAtlas = floorTex.maxAtlas;

        mapGenWorker.terminate();
        mapGenWorker = new Worker('js/mapgen.js', { type: "module" });
        mapGenWorker.onmessage = (event) => {
            if(event.data[0] == "buildComplete"){
                buildComplete=true;
            }else {
                mapTex(event.data,floorTex.textureCoordMap,floorTex.maxAtlas,floorTex.width,floorTex.height);
            }
        };
        curMapNumber = mapNum;
    }
    regenerateGameMap(largeRooms,mediumRooms,smallRooms);
 
}
document.querySelector('#regenerateMap').addEventListener('click', ()=>{
    mapSize = document.getElementById('mapSize').value;
    wallHeight = document.getElementById('wallHeight').value;
    var largeRooms = document.getElementById('largeRooms').value;
    var mediumRooms = document.getElementById('mediumRooms').value;
    var smallRooms = document.getElementById('smallRooms').value;
    
    var mapNum = document.getElementById("map").value;
    makeMap(mapNum);


});


var workerTerminated = false;
document.getElementById("stopGenerating").addEventListener('click', ()=>{
    console.log("stopping build");
    mapGenWorker.postMessage(["stopBuildTextureAtlas"]);
    mapGenWorker.terminate();
    mapGenWorker= new Worker('js/mapgen.js', { type: "module" });
    mapGenWorker.onmessage = (event) => {
        if(event.data[0] == "buildComplete"){
            buildComplete=true;
        }else {
            mapTex(event.data,floorTex.textureCoordMap,floorTex.maxAtlas,floorTex.width,floorTex.height);
        }
    };
});