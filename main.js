// Template code for A2 Fall 2021 -- DO NOT DELETE THIS LINE

var canvas;
var gl;

var program ;

var near = 1;
var far = 300;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var cameraXSpeed = 0;
var cameraYSpeed = 0;
var cameraZSpeed = 0;

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var BULLETTIME = 0.0; // time for big bullet
var resetTimerFlag = true ;
var resetBulletTimerFlag = true; // reset times for big bullet to be spawned
var animFlag = false ;
var prevTime = 0.0 ;
var prevTime2 = 0.0 ;
var frames = 0.0; // how many frames have been counted
var timeToShowFPS = 0.0; // time until fps is updated
var useTextures = 0 ;
var isRunning = false; // toggle run animation
var isShooting = false;  // toggle shoot animation
var isAtAngle = false; // for cannon angle
var isBigShooting = false // toggle big shot animation
var isSalute = false; // toggle salute animation
var isStanding = false // toggle is standing (no animations)
var bullets = []; // bullets array
var bulletBurst = []; // bust of bullets array
var burstTime = TIME + 2; // time till next burst
var bigShotFired = false; // check if big shot was fired
var bigBulletScale = -1; // scaling for big shot


// fragment shader uniform
var timeUniform;
var changeWithTimeUniform;

// tree initial render point
var treeX = 90;
var treeY = 7;
var treeZ = 20;
var treeZFactor = 1;
var treeCoords = []; // storing all tree coordinates

// generate tree coordinates
for (var i = 0; i < 9; i++){
  treeCoords.push(vec3(treeX, treeY, treeZ))

  // skip this tree
  if (treeX == -30){
    treeX = treeX - 20;
  }
  treeX = treeX - 20; // every 20 x a new tree is made
  treeY = treeY;
  // alternate sides of path for tree spawn
  if (treeZFactor > 0){
    treeZFactor = -1;
  }
  else{
    treeZFactor = 1;
  }
  // distance from path is random
  treeZ = treeZFactor * (Math.random() * (20 - 12) + 12); // distance from path is random
}

// array for storing all enemies in the form of [x, y, z, isAlive, isInPosition]
var enemyPool = [[-70, 10, 0, true, true, 0], [-15, 10, 40, false, false, 5], [20, 10, 60, false, false, 15]];

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;

var x = 0
var y = 0
var z = 0

var canvasContext;


function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTexture(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    console.log("here 2") ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;

    gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true ;

}

function initTextures() {

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"bodytexture.png") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"bodytexturewithoutshade.png") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"bigbullettexture.png") ;

    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],image2) ;

}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    console.log("here") ;

    textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
                                        "shininess"),materialShininess );
}

function toggleTextures() {
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,
                                         "useTextures"), useTextures );
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;

}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;

}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // uniform variables to trigger time dependent color changes
    changeWithTimeUniform = gl.getUniformLocation(program, "changeWithTime");
    timeUniform = gl.getUniformLocation(program, "TIME");

    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;
    ClosedCylinder.init(9,program) ; // modification of cylinder to close top and botton faces
    LowerTorsoShape.init(program); // custom lower torso object

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // set a default material
    setColor(materialDiffuse) ;

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };

    document.getElementById("runToggleButton").onclick = function() {
        if( isRunning ) {
            isRunning = false;
        }
        else {
            isRunning = true  ;
        }
    };

    document.getElementById("shootToggleButton").onclick = function() {
        if( isShooting ) {
            isShooting = false;
        }
        else {
            isShooting = true  ;
        }

        if( isAtAngle ) {
            isAtAngle = false;
        }
    };

    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };

    // load and initialize the textures
    initTextures() ;

    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;

    // intialize fps counter
    canvasContext = document.getElementById("fps-canvas").getContext("2d");
    canvasContext.font = "12px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("FPS: " + frames, canvas.width - 60, canvas.height - 10);

}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cylinder with closed faces along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Modified from template code by Christopher Lee
function drawClosedCylinder() {
    setMV() ;
    ClosedCylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// Centered at origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Draws a the lower torso of the player character
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawLowerTorsoShape() {
    setMV() ;
    LowerTorsoShape.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

eye = vec3(0,0,10);
z = 0;
x = -80;
y = 10.5;
at = vec3(x, y, z); // target of camera
eye = vec3(-100, 20, 0); // location of camera
cameraXSpeed = 0.05;

var runSpeed = 0.05;

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    at[0] += cameraXSpeed;
    at[1] += cameraYSpeed;
    at[2] += cameraZSpeed;


    if (isRunning){
      x = x + runSpeed;
    }

    // set the projection matrix
    projectionMatrix = ortho(left * 2, right * 2, bottom * 2, ytop * 2, near, far); // zooming in and out

    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);

    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;

    // apply the slider rotations
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;

    // send all the matrices to the shaders
    setAllMatrices() ;

    // get real time
    var curTime ;
    var curTime2;


    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        curTime2 = (new Date()).getTime() /1000 ;

        // number of frames is shown every 2 seconds
        if (timeToShowFPS >= 2){
          timeToShowFPS = 0;
          frames = frames / 2; // since it is updating every 2 seconds number of frames needs to be divided by 2
          console.log(frames) // output frames to console

          canvasContext.font = "12px Arial";
          canvasContext.fillStyle = "white";
          canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
          canvasContext.fillText("FPS: " + frames, canvas.width - 60, canvas.height - 10); // output frames to canvas window
          frames = 0;
        }
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        if( resetBulletTimerFlag ) {
            prevTime2 = curTime2 ;
            BULLETTIME = 0;
            resetBulletTimerFlag = false ;
        }
        frames = frames + 1;
        timeToShowFPS = timeToShowFPS + curTime - prevTime;
        TIME = TIME + curTime - prevTime ;
        BULLETTIME = BULLETTIME + curTime2 - prevTime2; // timing for big bullet shot
        prevTime = curTime ;
        prevTime2 = curTime2
    }

    gTranslate(0,0,0) ;

    // draw ground box
    gPush();
    {
      gScale(100, 5, 100);
      setColor(vec4(0.0,1.0,0.0,1.0)) ;
      drawCube() ;
    }
    gPop();

    // draw road/path
    gPush();
    {
      gTranslate(0,5.01,0);
      gScale(100, 0.01, 10);
      setColor(vec4(0.5,0.5,0.5,1.0)) ;
      drawCube() ;
    }
    gPop();

    // draw trees based on pregenerated coordinates
    for (var i = 0; i < treeCoords.length; i++){
      tree(treeCoords[i][0],treeCoords[i][1],treeCoords[i][2]);
    }

    for (var j = 0; j < enemyPool.length; j++){
      if (enemyPool[j][3]){
        smallEnemy(enemyPool[j], j);
      }
    }
    // mange scene triggers
    sceneManager();

    // draw main character
    mainCharacter();

    if( animFlag )
        window.requestAnimFrame(render);
}

function sceneManager(){

  if (TIME > 0 && isBigShooting == false && isSalute == false && isStanding == false){
    isRunning = true;
  }

  if (TIME > 2 && isBigShooting == false && isSalute == false && isStanding == false){
    isShooting = true;
  }

  if (Math.floor(TIME) == enemyPool[1][5] && enemyPool[1][3] == false){
    enemyPool[1][3] = true;
    cameraXSpeed = 0.1;
    at = vec3(enemyPool[1][0] + 10, enemyPool[1][1] + 3, 100);
    eye = vec3(-50, 20, -80);
  }

  if (Math.floor(TIME) == enemyPool[2][5] && enemyPool[2][3] == false){
    enemyPool[2][3] = true;
    cameraXSpeed = 0.4;
    at = vec3(enemyPool[2][0] + 10, enemyPool[2][1] + 3, -100);
    eye = vec3(-50, 20, 80);
  }

  if (Math.floor(TIME) == 25 && bigShotFired == false){
    isBigShooting = true;
    isShooting = false;
    isRunning = false;
    at = vec3(x, y, z);
    cameraXSpeed = 0.2;
    eye[0] = -100 * Math.cos(BULLETTIME * 5); // radius from eye to at is 100 point on circle around at is x = r * cos(theta) z = r * sin(theta)
    eye[1] = 20;
    eye[2] = -100 * Math.sin(BULLETTIME * 5);
    cameraXSpeed = 0.0;
    console.log(eye)

  }
  if (TIME >= 31.5 && TIME <= 32 && enemyPool[0][3] == true && enemyPool[1][3] == true && enemyPool[2][3] == true){
    for (var i = 0; i < enemyPool.length; i++){
      enemyPool[i][3] = false;
    }
  }
  if (Math.floor(TIME) == 32){
    isShooting = false;
    isRunning = false;
    isBigShooting = false;
    bigShotFired = false
    isStanding = true;
  }
  if (Math.floor(TIME) == 33){
    at = vec3(x, y, z);
    eye = vec3(-x  + 40, 17, z);
    isSalute = true;
    isStanding = false;
  }
}

// handle rendering of small enemy type
function smallEnemy (enemy, index){
  // small enemy
  gPush();
  {
    gTranslate(enemy[0], enemy[1], enemy[2]);
    gPush();{
      if (enemy[4] && index == 0){
        gTranslate(((TIME - enemy[5]) * 5), 0, 5 * Math.sin(TIME)); // movement enemy 1
      }
      else if (enemy[4] && index == 1){
        gTranslate(((TIME - enemy[5] - 5) * 5), 0, 5 * Math.sin(TIME * 2) + zEnemyMove1); // movement enemy 2
      }
      else if (enemy[4] && index == 2){
        gTranslate(((TIME - enemy[5] - 5) * 5), 0, 5 * Math.sin(TIME * 0.5) + zEnemyMove2); // movement enemy 3
      }
      // movement for enemy 2 to come from off screen to the path
      else if (enemy[4] == false && index == 1){
          zEnemyMove1 = (TIME - enemy[5]) * -1 * 12;
          if (enemy[2] + zEnemyMove1 > 1){
            gTranslate(0, 0, zEnemyMove1);
          }
          else{
            enemyPool[index][4] = true;
            // reset camera after enemy has moved into position
            at = vec3(x,y,z);
            cameraXSpeed = 0.1;
        }
      }
      // movement for enemy 3 to come from off screen to the path
      else if (enemy[4] == false && index == 2){
          zEnemyMove2 = (TIME - enemy[5]) * -1 * 12;
          if (enemy[2] + zEnemyMove2 > 1){
            gTranslate(0, 0, zEnemyMove2);
          }
          else{
            enemyPool[index][4] = true;
            // reset camera after enemy has moved into position
            at = vec3(x,y,z);
            cameraXSpeed = 0.2;
        }
      }
      // body
      gPush();{
        setColor(vec4(0.12,0.28,0.59,1.0)) ;
        gScale(0.75, 0.75, 0.75);
        drawCube();
      }
      gPop();
      // eye
      gPush();{
        gTranslate(-0.75, 0, 0);
        gRotate(90, 0.0, 1.0, 0.0);
        gScale(0.65, 0.65, 0.05);
        setColor(vec4(1.0,0.0,0.0,1.0)) ;
        drawSphere();
      }
      gPop();
      // pupil
      gPush();{
        gTranslate(-0.8, 0, 0);
        gRotate(90, 0.0, 1.0, 0.0);
        gScale(0.25, 0.35, 0.05);
        setColor(vec4(0.0,0.0,0.0,1.0)) ;
        drawSphere();
      }
      gPop();

      // cannon
      gPush();{
        gTranslate(0, -0.95, 0);
        gRotate(90, 1.0, 0.0, 0.0);
        gScale(0.75, 0.75, 0.75);
        setColor(vec4(0.0,0.0,0.0,1.0)) ;
        drawCone();
      }
      gPop();

    }
    gPop();
    }
  gPop();
}

// handle rendering of trees
function tree (x,y,z){
  // tree
  gPush();
  {
  gTranslate(x,y,z);

  // trunk of tree
  gPush();{
    gScale(0.5, 2, 0.5);
    setColor(vec4(0.647,0.1647,0.1647,1.0)) ;
    drawCube() ;
  }
  gPop();
  // draw cones for each layer of the tree
  gPush();{
    gTranslate(0,7,0);
    gScale(5, 10, 5);
    gRotate(270, 1,0,0);
    setColor(vec4(0.647,1,0.1647,1.0)) ;
    drawCone() ;
  }
  gPop();

  gPush();{
    gTranslate(0,10,0);
    gScale(4, 10, 4);
    gRotate(270, 1,0,0);
    setColor(vec4(0.647,1,0.1647,1.0)) ;
    drawCone() ;
  }
  gPop();
  gPush();{
    gTranslate(0,13,0);
    gScale(3, 10, 3);
    gRotate(270, 1,0,0);
    setColor(vec4(0.647,1,0.1647,1.0)) ;
    drawCone() ;
  }
  gPop();
  }
  gPop();
}

// handle rendering of main character
function mainCharacter(){
  // main character
  gPush() ;
  {
    // chracter movement

    gTranslate(x, y, z);
    gPush();{
      gRotate(90, 0,1,0);
    }

    // head

    gPush();{
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
      gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
      toggleTextures();
      // neck
      gPush();{
        gTranslate(0,0.75,0) ;
        gScale(0.75,0.25,0.75);
        gRotate(90,1,0,0) ;
        setColor(vec4(0.0,0.0,1.0,1.0)) ;
        drawCylinder() ;
      }
      toggleTextures();
      gPop();
      // head
      gPush();{
        gTranslate(0,1.75,0) ;
        gScale(0.85,1,0.75);
        setColor(vec4(1.0,0.855,0.725,1.0)) ;
        drawSphere() ;
      }
      gPop();
    }
    gPop();
    // torso
    toggleTextures();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    gPush();{
      gScale(1,0.75,0.5);
      drawCube() ;
    }
    gPop();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    // mid torso
    gPush();{
      gTranslate(0,-1.0,0) ;
      gScale(1,0.5,0.5);
      gRotate(90,1,0,0) ;
      setColor(vec4(0.0,0.0,1.0,1.0)) ;
      drawCone() ;
    }
    gPop();

    // lower torso
    gPush();{
      gTranslate(0,-1.5,0) ;
      gScale(0.75,0.5,0.5);
      setColor(vec4(0.0,0.0,1.0,1.0)) ;
      drawLowerTorsoShape() ;
    }
    gPop();
    // left arm
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    gPush();{
      // upper arm movement
      if (isRunning){
        gRotate(Math.cos(3 * TIME)*120/3.14159,1,0,0) ;
      }
      if (isBigShooting){
        gRotate(-90,1,0,0) ;
        gRotate(-20,0,0,1) ;
      }



      gPush();{
        gTranslate(1.75, 0.5, 0);
        // right shoulder
        gPush();{
          gScale(0.75,0.75,0.75);
          drawSphere() ;

        }
        gPop();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
        gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
        // arm below shoulder
        gTranslate(0.0, -0.75, 0);
        gPush();{
          if (isBigShooting){
            gRotate(-20,0,0,1) ;
          }
          gScale(0.25,0.75,0.25);
          setColor(vec4(0.0,0.0,1.0,1.0)) ;
          drawCube() ;
        }
        gPop();

        gPush();{
          // lower arm movement
          if (isRunning){
            gRotate((Math.cos(3 * TIME))  * 45/3.14159,1,0,0) ;
          }
          if (isBigShooting){
            gRotate(-60,0,0,1) ;
            gRotate(20,1,0,0) ;
          }

          // lower arm
          gPush();{
            gTranslate(0.0, -1.25, 0);
            gRotate(90, 1, 0, 0);
            gScale(1.25,1.25,1.5);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawClosedCylinder() ;
          }
          gPop();
          toggleTextures();
          // wrist
          gPush();{
            gTranslate(0.0, -2.0, 0);
            gScale(0.25,0.05,0.25);
            setColor(vec4(1.0,0.855,0.725,1.0)) ;
            drawCube() ;
          }
          gPop();
          // hand
          gPush();{
            gTranslate(0.0, -2.45, 0);
            gScale(0.4,0.4,0.4);
            setColor(vec4(1.0,0.855,0.725,1.0)) ;
            drawCube() ;
          }
          gPop();
        }
        gPop();
      }
      gPop();
    }
    gPop();

    // right arm
    toggleTextures();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    gPush();{
      // upper arm movement
      if (isRunning && !isShooting && !isBigShooting && ! isSalute){
        gRotate(Math.cos(3 * TIME)*-120/3.14159,1,0,0) ;
      }
      if (isSalute){
        gRotate(-60, 1, 0, 0);
      }
      gPush();{
        gTranslate(-1.75, 0.5, 0);
        // right shoulder
        gPush();{
          if (isSalute){
            gRotate(-30, 1, 0, 0)
            gRotate(Math.sin(TIME * 2) * 30 + 20,0,0,1) ;
          }
          gScale(0.75,0.75,0.75);
          setColor(vec4(0.0,0.0,1.0,1.0)) ;
          drawSphere() ;
        }
        gPop();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
        gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
        // arm below shoulder
        gTranslate(0.0, -0.75, 0);
        gPush();{
          if (isSalute){
            gRotate(-60, 1, 0, 0)
            gRotate(Math.sin(TIME * 2) * 30 + 20,0,0,1) ;
          }
          gScale(0.25,0.75,0.25);
          setColor(vec4(0.0,0.0,1.0,1.0)) ;
          drawCube() ;
        }
        gPop();

        gPush();{
          // lower arm movement
          if (isRunning && !isShooting && !isBigShooting && !isSalute){
            gRotate((Math.cos(3 * TIME))  * -45/3.14159,1,0,0) ;
          }

          if (isShooting || isBigShooting){
            gRotate(-90,1,0,0) ;
          }
          if (isSalute){
            gRotate(-90,1,0,0) ;
            gRotate(Math.sin(TIME * 2) * 30 + 20,0,0,1) ;
          }

          // lower arm
          gPush();{

            gTranslate(0.0, -1.25, 0);
            gRotate(90, 1, 0, 0);
            gScale(1.25,1.25,1.5);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawClosedCylinder() ;
          }
          gPop();
          toggleTextures();
          // cannon barrel
          gPush();{
            gTranslate(0.0, -2.0, 0);
            gPush();{
              gScale(0.35,0.15,0.35);
              setColor(vec4(0.0,0.0,0.0,1.0)) ;
              drawCube() ;
            }
            gPop();
            gPush();{
                gPush(); {
                  // Small bullet shooting code
                  if (isShooting){
                  var createBubbles = false;
                  var numBulletsCreate = 7
                  var bubbleDelay = 1;
                  for (var i = 0; i < 3; i++) {
                    if (bullets.length < 3 && Math.floor(TIME) != 0 && animFlag == true) {
                      bullets[i] = [0, 0, 0, Math.floor(TIME) + i * 8, numBulletsCreate, Math.floor(TIME) + i * 1]; // Every 4 seconds new bullet burst
                    }
                    else if (bullets.length != 0 && Math.floor(TIME) == bullets[i][3] && Math.floor(TIME) != 0 && animFlag == true) {
                      bullets[i] = [0, 0, 0, Math.floor(TIME) + 12, numBulletsCreate, Math.floor(TIME) + 1]; // Every 12 seconds overwrite old bullet with new bullet

                    }
                  }

                  // Bullet Burst
                  for (var i = 0; i < bullets.length; i++) {
                    if (Math.floor(TIME) == bullets[i][5] - 1 && Math.floor(TIME) != 0 && animFlag == true) {
                      for (var j = 0; j < bullets[i][4]; j++) {
                        if (burstTime - TIME < 0) {
                          bulletBurst.push([bullets[i][0], bullets[i][1], bullets[i][2]]);
                          burstTime = TIME + 0.3;
                        }
                      }
                    }
                  }
                }
                  // Draw bullets
                  if (bullets.length != 0 && bulletBurst.length != 0) {
                    for (var j = 0; j < bulletBurst.length; j++) {
                      bulletBurst[j][1] = bulletBurst[j][1] - 0.5; // Move straight with time
                      gl.uniform1i(changeWithTimeUniform, 1); // apply flashing colors using fragment shader
                      gl.uniform1f(timeUniform, TIME);
                      drawBullets(bulletBurst[j][0], bulletBurst[j][1], bulletBurst[j][2]);
                    }
                  }
                }
                gl.uniform1i(changeWithTimeUniform, 0);
                gPop();
                gPush();
                {
                  if (isBigShooting){
                    gTranslate(0, -3, 0);
                    if (bigShotFired == false){
                      if (bigBulletScale == -1){
                        resetBulletTimerFlag = true;
                      }
                      bigBulletScale = 3 * Math.sin(BULLETTIME / 3); // bullet gets bigger with time
                      gScale(bigBulletScale, bigBulletScale, bigBulletScale);
                      // bullet is big enough we stop making it bigger
                      if (bigBulletScale > 2.9){
                        resetBulletTimerFlag = true;
                        bigShotFired = true;
                      }
                    }
                    // if bullet is big enough we shoot it and it moves with time
                    if (bigShotFired){
                      gScale(3, 3, 3);
                      gTranslate(0, BULLETTIME * -10, 0);
                      bigBulletScale = -1;
                      // reset camera after big bullet has been fired
                      eye = vec3(-80, 20, 0);
                      at = vec3(x,y,z);
                      cameraXSpeed = 0.0;
                    }
                    gl.uniform1i(changeWithTimeUniform, 1); // apply flashing colors using fragment shader
                    gl.uniform1f(timeUniform, TIME);
                    setColor(vec4(1.0,0.188,0.0,1.0)) ;
                    drawSphere();
                    gl.uniform1i(changeWithTimeUniform, 0);
                  }
                }
                gPop();
              }
            gPop();
          }
          gPop();
        }
        gPop();
      }
      gPop();
    }
    gPop();

    // right leg
    toggleTextures();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    gPush();{
      // full leg movement
      gTranslate(0,-1.55,0) ;
      if (isRunning){
        gRotate(Math.cos(3 * TIME)*120/3.14159,1,0,0) ;
      }
      if (isBigShooting){
        gRotate(-20,1,0,0) ;
      }
      gPush();{
        // upper leg movement
        gTranslate(-0.5, -1.0, 0);
        // right thigh
        gPush();{
          gScale(0.35,0.75,0.25);
          setColor(vec4(0.0,0.0,1.0,1.0)) ;
          drawCube() ;
        }
        gPop();
        gPush();{
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
          gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

          // lower leg movement
          if (isRunning){
            gRotate(Math.abs(Math.sin(TIME))  * 45/3.14159,1,0,0) ;
          }
          if (isBigShooting){
            gRotate(20,1,0,0) ;
          }
          // lower leg
          gPush();{

            gTranslate(0.0, -1.25, 0);
            gScale(0.375,0.75,0.4);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawCube() ;
          }
          gPop();
          // foot
          gPush();{
            gTranslate(0.0, -2.25, 0.0);
            gScale(0.45,0.5,0.5);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawCube() ;
          }
          gPop();
        }
        gPop();
      }
      gPop();

    }
    gPop();

    // left leg
    gPush();{
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
      gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
      // full leg movement
      gTranslate(0,-1.55,0) ;
      if (isRunning){
        gRotate(Math.cos(3 * TIME)*-120/3.14159,1,0,0) ;
      }
      if (isBigShooting){
       gRotate(-20,1,0,0) ;
      }
      gPush();{
        // upper leg movement
        gTranslate(0.5, -1.0, 0);
        // left thigh
        gPush();{

          gScale(0.35,0.75,0.25);
          setColor(vec4(0.0,0.0,1.0,1.0)) ;
          drawCube() ;
        }
        gPop();
        gPush();{
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
          gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
          // lower leg movement
          if (isRunning){
            gRotate(Math.abs(Math.cos(TIME)) * 45/3.14159,1,0,0) ;
          }
          if (isBigShooting){
            gRotate(20,1,0,0) ;
          }
          // lower leg
          gPush();{
            gTranslate(0.0, -1.25, 0);
            gScale(0.375,0.75,0.4);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawCube() ;
          }
          gPop();
          // foot
          gPush();{
            gTranslate(0.0, -2.25, 0.0);
            gScale(0.45,0.5,0.5);
            setColor(vec4(0.0,0.0,1.0,1.0)) ;
            drawCube() ;
          }
          gPop();
        }
        gPop();
      }
      gPop();
    }
    gPop();
    toggleTextures();
  }
  gPop() ;
}

// Draw bullets at x, y, z coordinates
function drawBullets(x, y, z) {
  gPush(); {
    gTranslate(x, y, z);
    gScale(0.4, 0.4, 0.4);
    setColor(vec4(1.0,0.188,0.0,1.0)) ;
    drawSphere()
  }
  gPop();
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}
