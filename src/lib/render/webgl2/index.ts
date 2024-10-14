import * as twgl from "twgl.js";
// import "webgl-lint";
import vertexShader from "./2D/vertex.glsl?raw";
import fragmentShader from "./2D/fragment.glsl?raw";
import type { RGBA } from "$lib/index.svelte";

export default class WebGL2Renderer {
    width: number
    height: number
    board: Uint8ClampedArray
    thirdDimension: boolean
    private readonly gl: WebGL2RenderingContext
    private readonly programInfo: twgl.ProgramInfo
    private tileTexture: WebGLTexture
    private readonly colours: WebGLTexture
    private tiles: Uint8ClampedArray
    private readonly bufferInfo: twgl.BufferInfo;

    constructor(gl: WebGL2RenderingContext) {
        this.width = 64;
        this.height = 64;
        this.board = new Uint8ClampedArray(this.width * this.height);
        this.tiles = new Uint8ClampedArray(this.width * this.height)
        this.thirdDimension = false;
        this.gl = gl
        const program = twgl.createProgram(gl, [vertexShader, fragmentShader])
        this.programInfo = twgl.createProgramInfoFromProgram(gl, program)
        this.bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

        this.tileTexture = twgl.createTexture(gl, {
            mag: gl.NEAREST,
            min: gl.NEAREST,
            internalFormat: gl.R8,
            src: this.tiles,

            width: this.width,
            height: this.height,
        })

        this.colours = twgl.createTexture(gl, {
            mag: gl.NEAREST,
            min: gl.NEAREST,
            format: gl.RGBA,
            // TODO: Set limit for colours (1024)
            // 2024 TODO: Not now, we only have 17 colours.
            // src: new Uint8ClampedArray(3 * 1024), // support 1024 colours
            src: this.createColourTexture(), // support 256 colours
            // width: 1024,
            width: 17,
            height: 1,
        })

        // window.addEventListener("updateTileEvent", this.updateColours)
        // requestAnimationFrame(() => this.render())
        console.log("WebGL2 renderer initialised")
    }

    private createColourTexture() {
        // return new Uint8ClampedArray(3 * this.width * this.height)
        // return new Uint8ClampedArray(3 * 1024) // support 1024 colours
        // return new Uint8ClampedArray(4 * 256) // support 256 colours
        return new Uint8ClampedArray(4 * 17) // support 16 + ('all' color) RGBA colours
    }

    resize(width: number, height: number) {
        // width and height must be a positive integer
        if (!width || !height) return;

        // must be less than 1024 so the browser doesn't crash
        if (width > 1024 || height > 1024) return;

        this.width = width
        this.height = height
        this.board = new Uint8ClampedArray(this.width * this.height)
        this.tiles = new Uint8ClampedArray(this.width * this.height)
        this.tileTexture = twgl.createTexture(this.gl, {
            mag: this.gl.NEAREST,
            min: this.gl.NEAREST,
            internalFormat: this.gl.R8,
            src: this.tiles,
            width: this.width,
            height: this.height,
        })

        console.log("Resizing to", width, height)

        twgl.setTextureFromArray(this.gl, this.tileTexture, this.tiles, {internalFormat: this.gl.R8})
        this.render()
    }

    updateColours(colours: RGBA[]) {
        // let texture = new Uint8ClampedArray(3 * 1024)
        let texture = this.createColourTexture()
        texture.set(colours.flat(), 0)
        // twgl.setTextureFromArray(this.gl, this.colours, texture, {format: this.gl.RGB, width: 1024, height: 1})
        // twgl.setTextureFromArray(this.gl, this.colours, texture, {format: this.gl.RGBA, width: 256, height: 1})
        twgl.setTextureFromArray(this.gl, this.colours, texture, {format: this.gl.RGBA, width: 17, height: 1})
    }

    updateTiles() {
        this.tiles.set(this.board, 0)
        this.render()
    }

    render() {
        const [matrix, textureMatrix] = [twgl.m4.identity(), twgl.m4.identity()]

        twgl.setTextureFromArray(this.gl, this.tileTexture, this.tiles, {internalFormat: this.gl.R8})
        const uniforms = {
            matrix,
            textureMatrix,
            tiles: this.tileTexture,
            colours: this.colours,
        }

        // these convert from pixels to clip space
        twgl.m4.ortho(0, this.width, this.height, 0, -1, 1, matrix)

        // these move and scale the unit quad into the size we want
        // in the target as pixels
        // twgl.m4.translate(matrix, [0, 0, 0], matrix);
        twgl.m4.scale(matrix, [this.width, this.height, 1], matrix);
        // twgl.m4.scale(matrix, [1, 1, 1], matrix);

        this.gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
        twgl.setUniforms(this.programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo);
    }

}