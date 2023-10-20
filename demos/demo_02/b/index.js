// HelloPoint1.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = 
  'attribute float a_Size; \n' +
  ' void main() {\n' +
  '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the point
  '  gl_PointSize = a_Size;\n' +                    // Set the point size
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);\n' + // Set the point color
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

  // #[NEW] Pass Data to Programs
  {
    // step 1 - get storage location (in memory)
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_Size');

    // step 2 - assign a value to the attribute variable
    gl.vertexAttrib1f(a_PointSize, 20);
  }
  

  // update the size attribute depending on time elapsed (in ms)
  const updateSize = (gl, size_ptr, elapsed) => {
    // convert to seconds
    elapsed /= 1000;
    const duration = 5;
    gl.vertexAttrib1f(size_ptr, Math.min(1,(elapsed/duration))*300);

  }

  // #[NOTE] Encapsulate draw as a function
  const draw = (gl) => {
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw a point
    gl.drawArrays(gl.POINTS, 0, 1);
  }


  const prev = Date.now();
  const onTick = ()=>{
    // calcualte elapsed time
    const now = Date.now();
    const elapsed = now - prev;

    // update the relevant properties (update the state machine)
    updateSize(gl, a_PointSize, elapsed);

    // draw
    draw(gl);

    requestAnimationFrame(onTick);
  }

  onTick();

}
