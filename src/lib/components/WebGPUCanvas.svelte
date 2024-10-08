<script lang="ts">
    import { width, height } from "$lib/index.svelte";
    import { onMount } from "svelte";
    import WebGPURenderer from "$lib/render/webgpu";

    let { init }: { init: (renderer: WebGPURenderer) => void } = $props();

    let canvas = $state<HTMLCanvasElement>();
    let supportsWebGPU = $state(true);

    $inspect(canvas).with(async (type, c) => {
        // Not ready yet
        if (!c) return

        const glw = c.getContext("webgpu")!;
        const adapter = await navigator.gpu?.requestAdapter();
        if (!adapter) {
            supportsWebGPU = false
            return
        }

        const device = await adapter?.requestDevice();
        if (!device) {
            supportsWebGPU = false
            return
        }

        if (supportsWebGPU) {
            const renderer = new WebGPURenderer(width, height, glw, device)
            init(renderer)
        }
    })
</script>

{#if supportsWebGPU}
    <!--        TODO: There seems to be a bug in Linux WebGPU where the canvas is blurry unless we x2 the size -->
    <canvas bind:this={canvas} class="w-full m-auto"></canvas>
{:else}
    <div class="flex flex-col justify-center items-center bg-red-950/80 text-orange-400 w-full h-full">
        <p class="m-5 text-center">Your browser does not support WebGPU, But there is a good chance it's just disabled by default! Check out the <a href="https://caniuse.com/webgpu">WebGPU Compatibility Chart</a></p>
    </div>
{/if}

<style>
    canvas {
        max-width: calc(100vh - 350px);
    }
</style>
