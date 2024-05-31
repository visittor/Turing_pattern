import { initShader } from "./shaderLoader.js";

const vsSource=`#version 300 es
in vec2 a_position;
void main()
{
    gl_Position = vec4(a_position, 0, 1);
}
`;

const fsSource=`#version 300 es
precision highp float;

uniform sampler2D u_texture;

uniform vec2 u_resolution;

uniform vec4 u_foreground;
uniform vec4 u_background;

float edge0 = 0.15;
float edge1 = 0.25;

out vec4 FragColor;

void main()
{
    float h = texture(u_texture, gl_FragCoord.xy / u_resolution.xy ).y;
    float factor = smoothstep(edge0, edge1, h);
    FragColor = mix(u_background, u_foreground, factor);
}
`;

let programInfo = {program: null, vao: null, positionBuffer: null};

function initProgram(gl)
{
    const program = initShader(gl, vsSource, fsSource);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    const positionLocation = gl.getAttribLocation(program, "a_position");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const position = [  -1, -1,
                        -1,  1,
                         1, -1,
                         1,  1,
                    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        positionLocation, // location
        2, // num components
        gl.FLOAT, // type
        false, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(positionLocation);

    programInfo = {
        program: program,
        vao: vao,
        positionBuffer: positionBuffer,
    };
}

function setUniform(gl, fg, bg, resolution)
{
    const rezLocation = gl.getUniformLocation(programInfo.program, "u_resolution");
    const fgLocation = gl.getUniformLocation(programInfo.program, "u_foreground");
    const bgLocation = gl.getUniformLocation(programInfo.program, "u_background");
    const textureLocation = gl.getUniformLocation(programInfo.program, "u_texture");

    gl.uniform2f(rezLocation, resolution[0], resolution[1]);
    gl.uniform4f(fgLocation, fg[0], fg[1], fg[2], fg[3]);
    gl.uniform4f(bgLocation, bg[0], bg[1], bg[2], bg[3]);
    gl.uniform1i(textureLocation, 0);
}

function drawTexture(gl, computeTextures, fg, bg)
{

    if (programInfo.program === null)
    {
        initProgram(gl);
    }

    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, computeTextures.getReadTexture());

    gl.useProgram(programInfo.program);
    gl.bindVertexArray(programInfo.vao);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.positionBuffer);

    setUniform(gl, fg, bg, [gl.canvas.width, gl.canvas.height]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();

    gl.bindVertexArray(null);
}

export {drawTexture};