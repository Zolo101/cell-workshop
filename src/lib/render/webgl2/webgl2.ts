import * as twgl from "twgl.js";
// import "webgl-lint";
import vertexShader from "./vertex.glsl?raw";
import fragmentShader from "./fragment.glsl?raw";
import type { RGBA } from "$lib/index.svelte";

export default class WebGL2Renderer {
    width: number
    height: number
    private readonly gl: WebGL2RenderingContext
    private readonly programInfo: twgl.ProgramInfo
    private tileTexture: WebGLTexture
    private readonly colours: WebGLTexture
    private tiles: Uint8ClampedArray
    private readonly bufferInfo: twgl.BufferInfo;

    constructor(width: number, height: number, gl: WebGL2RenderingContext) {
        this.width = width;
        this.height = height;
        this.gl = gl
        const program = twgl.createProgram(gl, [vertexShader, fragmentShader])
        this.programInfo = twgl.createProgramInfoFromProgram(gl, program)
        this.tiles = new Uint8ClampedArray(this.width * this.height)
        this.bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

        this.tileTexture = twgl.createTexture(gl, {
            mag: gl.NEAREST,
            min: gl.NEAREST,
            internalFormat: gl.R8,
            src: this.tiles,
        })

        this.colours = twgl.createTexture(gl, {
            mag: gl.NEAREST,
            min: gl.NEAREST,
            format: gl.RGBA,
            // TODO: Set limit for colours (1024)
            // src: new Uint8ClampedArray(3 * 1024), // support 1024 colours
            src: this.createColourTexture(), // support 256 colours
            // width: 1024,
            width: 256,
            height: 1,
        })

        // window.addEventListener("updateTileEvent", this.updateColours)
        requestAnimationFrame(() => this.render())
        console.log("WebGL2 renderer initialised")
    }

    private createColourTexture() {
        // return new Uint8ClampedArray(3 * this.width * this.height)
        // return new Uint8ClampedArray(3 * 1024) // support 1024 colours
        return new Uint8ClampedArray(4 * 256) // support 256 colours
    }

    resize(width: number, height: number) {
        this.width = width
        this.height = height
        this.tiles = new Uint8ClampedArray(this.width * this.height)
        this.tileTexture = twgl.createTexture(this.gl, {
            mag: this.gl.NEAREST,
            min: this.gl.NEAREST,
            internalFormat: this.gl.R8,
            src: this.tiles,
        })

        twgl.setTextureFromArray(this.gl, this.tileTexture, this.tiles, {internalFormat: this.gl.R8})
        this.render()
    }

    updateColours(colours: RGBA[]) {
        // let texture = new Uint8ClampedArray(3 * 1024)
        let texture = this.createColourTexture()
        texture.set(colours.flat(), 0)
        // twgl.setTextureFromArray(this.gl, this.colours, texture, {format: this.gl.RGB, width: 1024, height: 1})
        twgl.setTextureFromArray(this.gl, this.colours, texture, {format: this.gl.RGBA, width: 256, height: 1})
    }

    updateTiles(tiles: ArrayLike<number>) {
        this.tiles.set(tiles, 0)
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
        twgl.m4.translate(matrix, [0, 0, 0], matrix);
        twgl.m4.scale(matrix, [this.width, this.height, 1], matrix);

        this.gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
        twgl.setUniforms(this.programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo);
    }

}