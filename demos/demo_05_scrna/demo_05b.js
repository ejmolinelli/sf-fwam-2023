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
  gl.vertexAttrib1f(a_PointSize, 0.1);


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

  const createColorsFromIndex = (clusterKeys, colors) =>{
    // #HARDCODED: number of final colors/clusters
    const MAX_COLORS = 60;
    const COUNT_COLORS = colors.length;
    const nBetween = MAX_COLORS/(COUNT_COLORS-1);

    // create iterable of "category", "vec3(color)" pairs
    const catColors = Array(MAX_COLORS).fill(0).map((_,i)=>{
      console.log(i);
      const frac = i/nBetween;
      // const lowerColor = d3.color(colors[Math.floor(frac)]).rgb();
      // const upperColor = d3.color(colors[Math.ceil(frac)]).rgb();
      const rfrac1 = Math.floor(Math.random()*(COUNT_COLORS-1))
      const rfrac2 = Math.floor(Math.random()*(COUNT_COLORS-1))
      const lowerColor = d3.color(colors[rfrac1]).rgb();
      const upperColor = d3.color(colors[rfrac2]).rgb();
      
      // categorical color
      const interpRatio = (i%nBetween)/nBetween;
      const cc = d3.color(d3.interpolateRgb(lowerColor,upperColor)(interpRatio)).rgb();
      const vec3Color = [cc.r/255.0, cc.g/255.0, cc.b/255.0];
      return [i, vec3Color];
    })

    // create colormap (primary palette colors)
    const colorMap = new Map(catColors);

    // initialize array to buffer to color attribute
    const colorsArray = new Float32Array(clusterKeys.length*3);

    // map cluster to color
    clusterKeys.forEach((key, idx)=>{
      // start index in full array
      colorsArray.set(colorMap.get(key-1), idx*3);
      // colorsArray.set([1.0, 0.0, 0.0], idx*3);
    });
    return colorsArray
  }


  const scaleMax = 50;
  let initScaleFactor = 20;
  const applyScaleFactor = (scaleFactor)=>{
    sceneData.scaleX = 1/(scaleMax-scaleFactor);
    sceneData.scaleY = 1/(scaleMax-scaleFactor);
  }

  const promCoords = fetch('../../data/10x_E18_C57BL_6.txt').then((r)=>r.arrayBuffer());
  const promCluster = fetch('../../data/10x_E18_C57BL_6_cluster.txt').then((r)=>r.arrayBuffer());
  const promColors = fetch('../../data/colors.json').then((r)=>r.json())

  Promise.all([promCoords,promCluster, promColors]).then((result)=>{
    // unpack coordinates
    sceneData.positions = new Float32Array(result[0]);

    // unpack cluster assignments
    const clusters = new Uint8Array(result[1]);
    const colors = result[2].colors.map(c=>c.value); // ["rgba(...)", "rgba(...)"]
    sceneData.colors = createColorsFromIndex(clusters, colors); // Float32Array([r1,g1,b1, r2,g2,b2])

    // appy scale factor
    applyScaleFactor(initScaleFactor);
    sceneData.numPoint = sceneData.positions.length/2;
  });



  // Graphical User Interface
  {
    var gui = new lil.GUI();

    
    let modelParams = {
      offsetX:0,
      offsetY:0,
      scale: initScaleFactor,
    }

    // control offset
    gui.add(modelParams, 'offsetX', -10, 10, 0.25).onChange(value=>{
      sceneData.offsetX = value;
    });
    gui.add(modelParams, 'offsetY', -10, 10, 0.25).onChange(value=>{
      sceneData.offsetY = value;
    });

    gui.add(modelParams, 'scale', 1, scaleMax, 1).onChange(value=>{
      applyScaleFactor(value)
    });
  }
  

}

