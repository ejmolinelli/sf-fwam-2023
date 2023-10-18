var VSHADER_SOURCE = 
  'attribute float a_Size; \n' +
  'attribute vec4 a_Position; \n' +
  'attribute vec4 a_Color; \n' + 
  'uniform mat4 u_ModelMatrix; \n' +
  'varying vec4 v_Color; \n' + // DEFINE A VARYING COLOR THAT CHANGES WITH EACH VERTEX
  ' void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' + 
  '  gl_PointSize = a_Size;\n' +
  '  v_Color = a_Color; \n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float; \n' +
  'uniform vec4 u_PointColor; \n' +
  'varying vec4 v_Color; \n' + 
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' + // Set the point color
  '}\n';

  function main() {

  // GLOBALS: variables to webgl context
  var gl;
  // initialize gl context
  {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  }
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_Size'); // point size
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position') // point position
  var u_PointColor = gl.getUniformLocation(gl.program, 'u_PointColor');
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.uniform4f(u_PointColor, 1, 0, 0, 1);
  gl.vertexAttrib1f(a_PointSize, 2);


  var positionBuffer = gl.createBuffer();
  var colorBuffer = gl.createBuffer();

  // scene state 
  let sceneData = {
    size: 3,
    positions: new Float32Array([]),
    colors: new Float32Array([]),
    numPoint: 0,
    scaleX:0,
    scaleY:0,
    offsetX: 0,
    offsetY:0
  }
  // shallow copy of scene state
  let prevSceneData = {...sceneData};
  sceneData.positions = new Float32Array([0.0,0.0, -0.5,0.5, 0.5,-0.5]);
  sceneData.colors = new Float32Array([1.0,0.0,0.0, 1.0,0.0,0.0, 1.0,0.0,0.0]);
  sceneData.scale = 1;


  // pass positions
  const passPositions = (data)=>{
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

  }

  // pass colors
  const passColors = (data)=>{
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
  }

  // pass model matrix value
  const passModel = (scaleX, scaleY, offsetX, offsetY) => {
    var modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.setScale(scaleX, scaleY, 1.0);
    modelMatrix.translate(offsetX, offsetY, 0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  }

  
  // draw
  const draw = (gl, clear) => {
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    if (clear){
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (sceneData.positions !== prevSceneData.positions){
      console.log("update positions");
      passPositions(sceneData.positions);
    }

    if (sceneData.colors !== prevSceneData.colors){
      console.log("update colors");
      passColors(sceneData.colors)
    }

    // MODEL Matrix (treat all coordinates as if they are one geometry!)
    passModel(sceneData.scaleX, sceneData.scaleY, sceneData.offsetX, sceneData.offsetY);
    

    // Draw all points
    gl.drawArrays(gl.POINTS, 0, sceneData.numPoint);

    // reset state
    prevSceneData = {...sceneData};
  }


  // render loop
  const onTick = ()=>{
    draw(gl, true);
    requestAnimationFrame(onTick);
  }
  onTick();


  const colorMap = new Map([
    [0, [1.0, 0.0, 0.0]], // red
    [1, [0.0, 1.0, 0.0]] // green
  ])

  const createColorsFromIndex = (indexValues) =>{
    const colorsArray = new Float32Array(indexValues.length*3);
    indexValues.forEach((key, idx)=>{
      const startIndex = idx*3;
      colorsArray.set(colorMap.get(key), startIndex);
    });
    return colorsArray
  }

  fetch('../../data/10x_pbmc3k.txt').then((r)=>{
    return r.arrayBuffer();
  }).then((buffer)=>{
    // sceneData.positions = new Float32Array(buffer).map(x=>x/25.0);
    // sceneData.numPoint = sceneData.positions.length/2;
    sceneData.positions = new Float32Array(buffer);
    sceneData.numPoint = sceneData.positions.length/2;
    sceneData.scaleX = 1/20.0;
    sceneData.scaleY = 1/20.0;

    // randomly assign color keys to each vertex
    const colorKeysPerVertex = Array(sceneData.numPoint).fill(0).map((x)=>Math.random()>0.5?1:0);
    sceneData.colors = createColorsFromIndex(colorKeysPerVertex);
  });


  // Graphical User Interface
  {
    var gui = new lil.GUI();

    let modelParams = {
      offsetX:0,
      offsetY:0,
      scale: 10,
    }

    // control offset
    gui.add(modelParams, 'offsetX', -10, 10, 0.25).onChange(value=>{
      sceneData.offsetX = value;
    });
    gui.add(modelParams, 'offsetY', -10, 10, 0.25).onChange(value=>{
      sceneData.offsetY = value;
    });

    gui.add(modelParams, 'scale', 1, 30, 1).onChange(value=>{
      sceneData.scaleX = 1/(30-value);
      sceneData.scaleY = 1/(30-value);
    });
  }
  

}

