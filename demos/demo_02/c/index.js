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
  'precision mediump float; \n' +
  'uniform vec4 u_PointColor; \n' +
  'void main() {\n' +
  '  gl_FragColor = u_PointColor;\n' + // Set the point color
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
  
  // #[NEW] initialize color
  {
    // step 1 - get storage location (in memory)
    var u_PointColor = gl.getUniformLocation(gl.program, 
        'u_PointColor');

    // step 2 - assign a value to the uniform variable
    gl.uniform4f(u_PointColor,1, 0, 0, 1);
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


  // draw
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
    updateColor(gl, u_PointColor, elapsed);

    // draw
    draw(gl);

    // only returns when this tab is active
    // and ready to draw!!
    requestAnimationFrame(onTick);
  }
  onTick();

}

