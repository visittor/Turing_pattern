import { initShader } from "./shaderLoader.js";
import { drawCircle } from "./circle.js";
import { PingPongTextures } from "./textures.js"
import { reaction_diffusion } from "./reaction_diffusion.js";
import { drawTexture } from "./drawTexture.js";
import { Settings } from "./init_element.js";

main();

function main()
{
    Settings();


    const canvas = document.getElementById("glcanvas");
    const image = document.getElementById("image");
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight - 100;
    if (canvas === null)
    {
        alert("WTF");
    }

    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert(
            "Unable to initialize WebGL. Your browser or machine may not support it.",
        );
      return;
    }

    const ext = gl.getExtension("EXT_color_buffer_float");
    const fbo = gl.createFramebuffer();
    // const read_fbo = gl.createFramebuffer();

    // let computeTexture = new PingPongTextures(gl, Settings.texture_width, Settings.texture_height);
    const computeTexture = new PingPongTextures(gl, canvas.width, canvas.height);
    // const killfeedTexture = new PingPongTextures(gl, 1000, 1000);
    // drawKillFeedField(gl, killfeedTexture, read_fbo);

    // image.addEventListener("mousedown", (e) => {
    //     let rect = e.target.getBoundingClientRect();
    //     let mouseX = e.clientX - rect.left;
    //     let mouseY = image.height - (e.clientY - rect.top);
    //     // console.log(mouseX, mouseY);

    //     mouseX *= killfeedTexture.getWidth() / image.width;
    //     mouseY *= killfeedTexture.getHeight() / image.height;

    //     // Settings.killfeedTexture.renderTexture();

    //     gl.bindFramebuffer(gl.FRAMEBUFFER, read_fbo);
    //     gl.framebufferTexture2D(
    //                             gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, 
    //                             killfeedTexture.getReadTexture(), 0
    //                         );
    //     let pixels = new Float32Array(1 * 1 * 4);
    //     gl.readPixels(mouseX, mouseY, 1, 1, gl.RGBA, gl.FLOAT, pixels);
    //     console.log(pixels, mouseX, mouseY);
    // });

    gl.clearColor(229./255, 229./255, 229/255., 1.);
    gl.clearDepth(1.);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);
    gl.enable(gl.BLEND);

    // initComputeTexture(gl, computeTexture, fbo);

    function render(now)
    {
        if (Settings.doUpdate)
        {
            for (let i = 0; i < 25; i++)
            {
                reaction_diffusion(gl, fbo, computeTexture, Settings);

            }
        }
        drawTexture(gl, computeTexture, [168/255, 0, 0, 1], [229/255, 229/255, 229/255, 1]);

        // computeTexture.renderTexture();
        // killfeedTexture.renderTexture();

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initComputeTexture(gl, texture, fbo)
{

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture.getWriteTexture(),
        0,
    );

    gl.clearColor(1., 0., 0., 1.);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, texture.getWidth(), texture.getHeight());

    const projMat = mat4.create();
    const left = (-gl.canvas.clientWidth / 2);
    const right = (gl.canvas.clientWidth / 2);
    const top = (-gl.canvas.clientHeight / 2);
    const bot = ( gl.canvas.clientHeight / 2);
    mat4.ortho(projMat, left, right, top, bot, 0.01, 100);

    const viewMat = mat4.create();
    mat4.translate(viewMat, viewMat, [0., 0., -6.]);

    let modelMat = mat4.create();
    mat4.translate(modelMat, modelMat, [0, 0, 0]);
    let mvMat = mat4.create(); mat4.mul(mvMat, viewMat, modelMat);
    drawCircle(gl, 21, [0, 1., 0, 1], mvMat, projMat, true);

    // modelMat = mat4.create();
    // mat4.translate(modelMat, modelMat, [-200, -200, 0]);
    // mvMat = mat4.create(); mat4.mul(mvMat, viewMat, modelMat);
    // drawCircle(gl, 21, [0, 1., 0, 1], mvMat, projMat, true);

    // modelMat = mat4.create();
    // mat4.translate(modelMat, modelMat, [200, -200, 0]);
    // mvMat = mat4.create(); mat4.mul(mvMat, viewMat, modelMat);
    // drawCircle(gl, 21, [0, 1., 0, 1], mvMat, projMat, true);

    // modelMat = mat4.create();
    // mat4.translate(modelMat, modelMat, [-200, 200, 0]);
    // mvMat = mat4.create(); mat4.mul(mvMat, viewMat, modelMat);
    // drawCircle(gl, 21, [0, 1., 0, 1], mvMat, projMat, true);

    // modelMat = mat4.create();
    // mat4.translate(modelMat, modelMat, [200, 200, 0]);
    // mvMat = mat4.create(); mat4.mul(mvMat, viewMat, modelMat);
    // drawCircle(gl, 21, [0, 1., 0, 1], mvMat, projMat, true);

    texture.swap();

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

function drawKillFeedField(gl, texture, fbo)
{
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture.getWriteTexture(),
        0,
    );

    gl.clearColor(1., 0., 0., 1.);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, texture.getWidth(), texture.getHeight());

    const vsSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_killfeed;

    out vec2 killfeed;

    void main()
    {
        gl_Position = vec4(a_position, 0, 1);
        killfeed = a_killfeed;
    }
    `;

    const fsSource = `#version 300 es

    precision highp float;

    in vec2 killfeed;

    uniform vec2 u_canvas_rez;

    out vec4 FragColor;

    void main()
    {
        FragColor = vec4( killfeed,  0, 1 );
    }
    `;

    const program = initShader(gl, vsSource, fsSource);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posLoc = gl.getAttribLocation(program, "a_position");
    const posBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);
    // const pos = [ -1,-1, -1,1, 1,-1, 1,1 ];
    const pos = [-1,-1, 1,-1, -1,-0.5, 1,-0.5, -1,0, 1,0, -1,0.5, 1,0.5, -1,1, 1,1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        posLoc,
        2,
        gl.FLOAT,
        false,
        0,
        0,
    );
    gl.enableVertexAttribArray(posLoc);

    const min_kill = 0.032, max_kill = 0.07, min_feed = 0.01, max_feed = 0.095;
    const killfeedLoc = gl.getAttribLocation(program, "a_killfeed");
    const killfeedBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, killfeedBuff);
    // const killfeed = [ min_kill,min_feed, min_kill,max_feed, max_kill,min_feed, max_kill,max_feed ];
    const killfeed = [ 
                        0.04706,        0.01925,
                        0.05572,        0.01789,
                        0.05623,        0.03598,
                        0.06429,        0.03553,
                        0.06039,        0.05491,
                        0.06718,        0.05525,
                        0.05993,        0.07463,
                        0.06297,        0.07814,
                        0.05855,        0.08529,
                        0.05871,        0.08221,
                    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(killfeed), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        killfeedLoc,
        2,
        gl.FLOAT,
        false,
        0,
        0,
    );
    gl.enableVertexAttribArray(killfeedLoc);

    const idxBuff = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuff);
    // const idx = [0, 1, 2, 3];
    const idx = [
                    0, 2, 1, 3,
                    2, 4, 3, 5,
                    4, 6, 5, 7,
                    6, 8, 7, 9,
                ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    gl.useProgram(program);

    const feed_Loc = gl.getUniformLocation(program, "u_feed");
    const kill_loc = gl.getUniformLocation(program, "u_kill");
    const rez_loc  = gl.getUniformLocation(program, "u_canvas_rez");

    gl.uniform2f(feed_Loc, 0.095, 0.01);
    gl.uniform2f(kill_loc, 0.07, 0.032);
    gl.uniform2f(rez_loc, texture.getWidth(), texture.getHeight());

    // gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.TRIANGLE_STRIP, 16, gl.UNSIGNED_SHORT, 0);

    gl.flush();
    texture.swap();

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

export {Settings}