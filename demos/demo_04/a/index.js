// Vertex shader program
var VSHADER_SOURCE = 
  'attribute float a_Size; \n' +
  'attribute vec4 a_Position; \n' +
  ' void main() {\n' +
  '  gl_Position = a_Position;\n' + // Set the vertex coordinates of the point
  '  gl_PointSize = a_Size;\n' +                    // Set the point size
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float; \n' +
  'void main() {\n' +
  '  float theDistance = distance( vec2(0.0,400.0), gl_FragCoord.xy) / 500.0;\n' +
  '  gl_FragColor = vec4(gl_FragCoord.x/400.0, gl_FragCoord.y/400.0, 0.0, theDistance);\n' + // Set the point color
  '}\n';

function main() {

  // initialize
  {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
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

  // initialize size (attribute variable)
  {
    // step 1 - get storage location (in memory)
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_Size');

    // step 2 - assign a value to the attribute variable
    gl.vertexAttrib1f(a_PointSize, 20);
  }
  
  // # initialize color
  {
    // step 1 - get storage location (in memory)
    var u_PointColor = gl.getUniformLocation(gl.program, 
        'u_PointColor');

    // step 2 - assign a value to the uniform variable
    gl.uniform4f(u_PointColor, 1, 0, 0, 1);
  }

  // update the size attribute depending on time elapsed (in ms)
  const updateSize = (gl, sizeLocation, elapsed) => {
    // convert to seconds
    elapsed /= 1000;
    const duration = 5;
    gl.vertexAttrib1f(a_PointSize, Math.min(1,(elapsed/duration))*300);

  }

  // update color
  const red = new Color("sRGB", [1,0,0]);
  const green = new Color("sRGB",[0,1,0]);
  const blue = new Color("sRGB", [0,0,1]);
  const updateColor = (gl, colorLocation, elapsed) => {
      elapsed /= 1000;
    
    
      // interpolate color based on elapsed time
      let interpColor;
      {
          const duration = 5;
          const midpoint = duration/2;
          let interp;
          let frac = 0;
          if (elapsed < midpoint){
              interp = red.range(green);
              frac = elapsed/midpoint;
          } else {
              interp = green.range(blue);
              frac = (elapsed - midpoint)/(duration-midpoint);
          }
          var targetcolor = interp(frac);
          interpColor = Object.values(targetcolor.p3);
      }
    
      gl.uniform4f(colorLocation, ...interpColor, 1);

  }

  // #[NEW] Build the array buffer for point positions
  const points = generateUnitPoints_vec4(100_000);
  const pointsArray = new Float32Array(points.reduce((a,b)=>{
        // add each posiiton attribute to the array
        a.push(b[0]);
        a.push(b[1]);
        return a;
  }, []));

  {
    // step 1: create the buffer
    const positionBuffer = gl.createBuffer();

    // step 2: bind the buffer to the ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // step 3: move data from js to buffer
    gl.bufferData(gl.ARRAY_BUFFER, pointsArray, gl.STATIC_DRAW);

    // step 4: instruct vertex shader to get values for a_Position from the buffer
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // step 5: enable
    gl.enableVertexAttribArray(a_Position);

  }

 

  // draw
  const draw = (gl, clear) => {
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    if (clear){
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
    
    // Draw all points
    gl.drawArrays(gl.POINTS, 0, 10_000);
  }

  // create points to draw to screen (every frame)
  

  const prev = Date.now();
  const onTick = ()=>{
    // update position and size
    gl.vertexAttrib1f(a_PointSize, 3);
    draw(gl, true);

    // only returns when this tab is active
    // and ready to draw!!
    requestAnimationFrame(onTick);
  }
  onTick();

}

