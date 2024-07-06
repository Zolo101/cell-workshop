<script lang="ts">
    import { height, init, width } from "$lib";
    import { onMount } from "svelte";
    import WebGPURenderer from "$lib/render/webgpu";

    let canvas: HTMLCanvasElement;
    let supportsWebGPU = $state(true);
    onMount(async () => {
        const glw = canvas.getContext("webgpu")!;
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
    <canvas bind:this={canvas} class="w-full" width={width * (600 / width)} height={width * (600 / height)}></canvas>
{:else}
    <div class="flex flex-col justify-center items-center bg-red-950/80 text-orange-400 w-full h-full">
        <p class="m-5 text-center">Your browser does not support WebGPU, But there is a good chance it's just disabled by default! Check out the <a href="https://caniuse.com/webgpu">WebGPU Compatibility Chart</a></p>
        <p class="text-xs">WebGL support is planned in the near future...</p>
    </div>
{/if}
