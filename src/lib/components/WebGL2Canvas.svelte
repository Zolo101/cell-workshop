<script lang="ts">
    import { height, width } from "$lib/index.svelte";
    import WebGL2Renderer from "$lib/render/webgl2";

    let { init }: { init: (renderer: WebGL2Renderer) => void } = $props();

    let canvas = $state<HTMLCanvasElement>();
    let supportsWebGL2 = $state(true);
    let gl2 = $state<WebGL2RenderingContext | null>();

    $inspect(canvas).with(async (type, c) => {
        // Not ready yet
        if (!c) return

        gl2 = c.getContext("webgl2");

        if (gl2) {
            const renderer = new WebGL2Renderer(width, height, gl2)
            init(renderer)
        } else {
            supportsWebGL2 = false
        }
    })
</script>

{#if supportsWebGL2}
    <canvas bind:this={canvas} class="w-full m-auto" width={width * (600 / width)} height={width * (600 / height)}></canvas>
{:else}
    <div class="flex flex-col justify-center items-center bg-red-950/80 text-orange-400 w-full h-full">
        <p class="text-xl font-bold text-center">Your browser does not support WebGL2.</p>
        <p class="text-center">Please update your browser and/or device.</p>
    </div>
{/if}

<style>
    canvas {
        max-width: calc(100vh - 350px);
    }
</style>