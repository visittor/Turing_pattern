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

uniform float u_diffusion_rate;
uniform float u_feed;
uniform float u_kill;

uniform vec2 u_mouse_pos;
uniform bool u_mouse_down;

uniform bool u_reset;

uniform sampler2D u_texture;

out vec4 FragColor;

#define onePix vec2(1.)/vec2(textureSize(u_texture,0))
#define t(x,y) texture(u_texture, gl_FragCoord.xy / vec2(textureSize(u_texture,0)) + onePix * vec2(x,y)).xy

vec2 laplacian()
{
    vec2    v00 = t(-1,1), v10 = t(0,1), v20 = t(1,1),
            v01 = t(-1,0), v11 = t(0,0), v21 = t(1,0),
            v02 = t(-1,-1),v12 = t(0,-1),v22 = t(1,-1);
    
    return 0.2*(v10 + v01 + v21 + v12) - v11 + 0.05*(v00 + v20 + v02 + v22);
}

void main()
{
    vec2 curr = t(0.,0.);

    vec2 F = vec2( u_feed * (1.-curr.x), -1. * (u_feed + u_kill) * curr.y );
    vec2 react = vec2( -1., 1. ) * curr.x * curr.y * curr.y;
    vec2 diffuse = laplacian() * u_diffusion_rate * vec2(1., 0.5);

    float dt = 1. / (4. * u_diffusion_rate);
    dt = 1.;
    vec2 n = curr + (F + react + diffuse) * dt;
    FragColor = vec4( n, 0, 1);

    if (u_mouse_down)
    {
        float R = 5.;
        FragColor.y += max(0.5 - FragColor.y, 0.0) * max(R - distance(gl_FragCoord.xy, u_mouse_pos), 0.0) / R;
    }
    else if (u_reset)
    {
        FragColor = vec4(0.0);
    }
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

function setUniform(gl, diffusion_rate, feed, kill, mouseX, mouseY, mouseDown, reset)
{
    const drLocation = gl.getUniformLocation(programInfo.program, "u_diffusion_rate");
    const feedLocation = gl.getUniformLocation(programInfo.program, "u_feed");
    const killLocation = gl.getUniformLocation(programInfo.program, "u_kill");
    const textureLocation = gl.getUniformLocation(programInfo.program, "u_texture");

    const mousePosLocation = gl.getUniformLocation(programInfo.program, "u_mouse_pos");
    const mouseDownLocation = gl.getUniformLocation(programInfo.program, "u_mouse_down");

    const resetLocation = gl.getUniformLocation(programInfo.program, "u_reset");

    gl.uniform1f(drLocation, diffusion_rate);
    gl.uniform1f(feedLocation, feed);
    gl.uniform1f(killLocation, kill);
    gl.uniform1i(textureLocation, 0);

    gl.uniform2f(mousePosLocation, mouseX, mouseY);
    gl.uniform1i(mouseDownLocation, mouseDown);

    gl.uniform1i(resetLocation, reset);
}

function reaction_diffusion(gl, fbo, computeTextures, settings)
{

    if (programInfo.program === null)
    {
        initProgram(gl);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        computeTextures.getWriteTexture(),
        0,
    );

    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, computeTextures.getWidth(), computeTextures.getHeight());

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, computeTextures.getReadTexture());

    gl.useProgram(programInfo.program);
    gl.bindVertexArray(programInfo.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.positionBuffer);

    setUniform(
                gl, 
                settings.diffuse_rate, settings.feed, settings.kill,
                settings.mouseX, settings.mouseY, settings.mouseDown,
                settings.reset,
            );
        settings.reset = 0;

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
    computeTextures.swap();

    gl.bindVertexArray(null);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        null,
        0,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export {reaction_diffusion};