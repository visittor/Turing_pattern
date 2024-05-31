import { PingPongTextures } from "./textures.js";
import { initShader } from "./shaderLoader.js";

function Settings()
{
    Settings.texture_width = 1000;
    Settings.texture_height = 1000;

    const center = document.getElementById("canvas_block");
    console.log(center)

    const canvas = document.createElement("canvas");
    canvas.id = "glcanvas";

    const width = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8);
    canvas.width = width;
    canvas.height = width;

    const image = document.createElement("img");
    image.id = "image";

    image.width = width / 2;
    image.height = width / 2;
    image.style.paddingBottom = `${width / 2}px`;
    image.style.paddingLeft = "10px";
    image.style.filter = "grayscale(100%)";
    image.src = "image/stretch.png"

    center.appendChild(canvas);
    center.appendChild(image);

    const gl = canvas.getContext("webgl2");
    gl.getExtension("EXT_color_buffer_float");
    Settings.fbo = gl.createFramebuffer();
    Settings.killfeedTexture = new PingPongTextures(gl, 1000, 1000);
    drawKillFeedField(gl, Settings.killfeedTexture, Settings.fbo);

    ////////////////////////////////////////////////////////////

    Settings.diffuse_rate = 1;
    Settings.feed = 0.0545;
    Settings.kill = 0.062;
    Settings.mouseX = 0;
    Settings.mouseY = 0;
    Settings.mouseDown = 0;
    Settings.reset = 0;

    // This param works
    //  default: diff: 1. feed: 0.0545 kill: 0.062
    //  bubble: diff: 0.25 feed: 0.01 kill: 0.045
    //  dot: diff 1. feed: 0.032 kill: 0.062
    //  cell division: diff: 1. feed: 0.025 kill: 0.06
    //  dot&dash: diff: 0.5 feed: 0.034 kill: 0.0618
    //  voronoi: diff: 1. feed: 0.1 kill: 0.055
    //  net: diff: 0.25 feed: 0.039 kill: 0.058
    //  maze: diff: 0.5 feed: 0.072 kill: 0.062
    const preset = { 
    default: {diffuse_rate:1., feed: 0.0545, kill: 0.062},
    bubble: {diffuse_rate:0.25, feed: 0.01, kill: 0.045},
    dot: {diffuse_rate:1., feed: 0.032, kill: 0.062},
    cell_division: {diffuse_rate:1., feed: 0.025, kill: 0.06},
    dot_dash: {diffuse_rate:0.5, feed: 0.034, kill: 0.0618},
    voronoi: {diffuse_rate:1., feed: 0.1, kill: 0.055},
    net: {diffuse_rate:.25, feed: 0.039, kill: 0.058},
    maze: {diffuse_rate:0.5, feed: 0.072, kill: 0.062},
    }

    Settings.doUpdate = true;

    
    const reset_button = document.getElementById("reset");
    reset_button.addEventListener("click", (e)=>{
        Settings.reset = 1;
    });

    const update_checkbox = document.getElementById("update");
    update_checkbox.addEventListener("change", () => {
    if(update_checkbox.checked)
    {
        Settings.doUpdate = true;
    }
    else
    {
        Settings.doUpdate = false;
    }
    });

    const diffuse_input = document.getElementById("diffuse");
    diffuse_input.addEventListener( "change", (e) =>{
        Settings.diffuse_rate = e.target.value;
    });

    const feed_input = document.getElementById("feed");
    feed_input.addEventListener( "change", (e) =>{
        Settings.feed = e.target.value;
    });

    const kill_input = document.getElementById("kill");
    kill_input.addEventListener( "change", (e) =>{
        Settings.kill = e.target.value;
    });

    Settings.diffuse = diffuse_input.value;
    Settings.feed = feed_input.value;
    Settings.kill = kill_input.value;

    const preset_select = document.getElementById("preset");
    for (var k in preset)
    {
        const opt = document.createElement("option");
        opt.text = k;
        opt.value = k;
        preset_select.add(opt);
    }
    preset_select.addEventListener("change", (e) => {
        let k = e.target.value;
        Settings.diffuse_rate = preset[k].diffuse_rate;
        Settings.kill = preset[k].kill;
        Settings.feed = preset[k].feed;

        diffuse_input.value = preset[k].diffuse_rate;
        feed_input.value = preset[k].feed;
        kill_input.value = preset[k].kill;
    });

    canvas.addEventListener("mousemove", (e) => {
        let rect = e.target.getBoundingClientRect();
        Settings.mouseX = e.clientX - rect.left;
        Settings.mouseY = canvas.height - (e.clientY - rect.top);
    });

    canvas.addEventListener("mousedown", (e) => {
        let rect = e.target.getBoundingClientRect();
        Settings.mouseDown = 1;
        Settings.mouseX = e.clientX - rect.left;
        Settings.mouseY = canvas.height - (e.clientY - rect.top);

        console.log(Settings.mouseX, Settings.mouseY, Settings.mouseDown);
    });

    canvas.addEventListener("mouseup", (e) => {
        let rect = e.target.getBoundingClientRect();
        Settings.mouseDown = 0;
        Settings.mouseX = e.clientX - rect.left;
        Settings.mouseY = canvas.height - (e.clientY - rect.top);
    });


    image.addEventListener("mousedown", (e) => {
        let rect = e.target.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = image.height - (e.clientY - rect.top);

        mouseX *= Settings.killfeedTexture.getWidth() / image.width;
        mouseY *= Settings.killfeedTexture.getHeight() / image.height;

        gl.bindFramebuffer(gl.FRAMEBUFFER, Settings.fbo);
        gl.framebufferTexture2D(
                                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, 
                                Settings.killfeedTexture.getReadTexture(), 0
                            );
        let pixels = new Float32Array(1 * 1 * 4);
        gl.readPixels(mouseX, mouseY, 1, 1, gl.RGBA, gl.FLOAT, pixels);
        console.log(pixels, mouseX, mouseY);

        kill_input.value = pixels[0];
        feed_input.value = pixels[1];

        Settings.kill = pixels[0];
        Settings.feed = pixels[1];
    });
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