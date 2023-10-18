// Vertex shader program
var VSHADER_SOURCE = 
  'attribute float a_Size; \n' +
  'attribute vec4 a_Position; \n' +
  'attribute vec4 a_Color; \n' +
  // 'varying vec3 v_Color; \n' + // VARYING means different for each vertex
  ' void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = a_Size;\n' +
  // '  v_Color = a_Color; \n' + //  PASS TO FRAGMENT SHADER

  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float; \n' +
  // 'varying vec3 v_Color; \n' + 
  'void main() {\n' +
  '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  // '  gl_FragColor = vec4(v_Color, 1.0);\n' + // USE THE VARYING (PER-VERTEX) COLOR
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
  var a_PointColor = gl.getAttribLocation(gl.program, 'a_Color'); // point color
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position') // point position


  var positionBuffer = gl.createBuffer();
  var colorBuffer = gl.createBuffer();

  // scene state 
  let sceneData = {
    size: 3,
    positions: new Float32Array([]),
    colors: new Float32Array([]),
    numPoint: 0
  }
  // shallow copy of scene state
  let prevSceneData = {...sceneData};
  sceneData.positions = new Float32Array([0.0,0.0, -0.5,0.5, 0.5,-0.5]);


  // pass positions
  const passPositions = (data)=>{
    // var positionBuffer = gl.createBuffer();
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position') // point position
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(positionBuffer, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

  }

  const passColors = (data)=>{
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(colorBuffer, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_PointColor, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointColor);
  }

  
  // draw
  const draw = (gl, clear) => {
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    if (clear){
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // update point positions if data has changed
    if (sceneData.positions !== prevSceneData.positions){
      console.log("updating positions");
      passPositions(sceneData.positions);
    }
    if (sceneData.colors !== prevSceneData.colors){
      console.log("updating colors");
      passColors(sceneData.colors)
    }
    if (sceneData.size !== prevSceneData.size){
      gl.vertexAttrib1f(a_PointSize, 1);
    }
    
    // Draw all points
    gl.drawArrays(gl.POINTS, 0, sceneData.numPoint);

    // reset state
    prevSceneData = {...sceneData};
  }


  draw(gl, true);
  // render loop
  // const onTick = ()=>{
  //   draw(gl, true);
  //   requestAnimationFrame(onTick);
  // }
  // onTick();



  fetch('../../data/10x_pbmc3k.txt').then((r)=>{
    return r.arrayBuffer();
  }).then((buffer)=>{
    // sceneData.positions = new Float32Array(buffer).map(x=>x/25.0);
    // sceneData.numPoint = 100;
  });


}

