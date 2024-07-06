<script lang="ts">
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import {
        height,
        model,
        rules,
        pause,
        playing,
        restart,
        stepPerformance,
        steps,
        width,
        successfulBuild,
        errorMessage, step, traversalsPerIntervalInput
    } from "$lib";
    import WebGPUCanvas from "$lib/components/WebGPUCanvas.svelte";
    import Guide from "$lib/components/Guide.svelte";
    import Editor from "$lib/components/Editor.svelte";
</script>

<div class="flex w-full gap-2 p-5">
<!--    <dialog open class="w-full h-full bg-neutral-600/50 backdrop-blur-xs">-->
<!--    <dialog class="invisible absolute top-0 flex justify-center items-center z-10 w-full h-full bg-neutral-900/80">-->
<!--        <Guide/>-->
<!--    </dialog>-->
	<section class="w-1/2">
        <WebGPUCanvas/>
        <section class="flex gap-2 p-2 font-bold text-neutral-300 *:bg-neutral-800/40 *:px-2 *:py-1">
            <div>
                <span>Size:</span>
                <span class="text-blue-500 font-black">{width}</span>
                <span>X</span>
                <span class="text-pink-500 font-black">{height}</span>
            </div>
            <div>
                <span>Steps:</span>
                <span class="text-green-500 font-black">{$steps.toLocaleString()}</span>
            </div>
            <div>
                <span>Step time:</span>
                <span class="text-amber-500 font-black">{$stepPerformance.toLocaleString()}ms</span>
            </div>
        </section>
        <section>
            <input type="range" min="1" max="5" bind:value={$traversalsPerIntervalInput} step="1"/>
            <span>Traversals per step: {$traversalsPerIntervalInput ** 2}</span>
        </section>
        <section class="flex m-5 gap-2 justify-around">
            <button on:click={pause}>{$playing ? "Resume" : "Pause"}</button>
            <button on:click={step}>Step Once</button>
            <button on:click={restart}>Restart</button>
        </section>
    </section>
	<section class="w-1/2 mx-2 *:p-2 *:mb-2">
        <section class="bg-cyan-950/80">
            <Editor/>
            <p class="text-xs text-right text-cyan-400 pt-2">Check out this <a>short guide</a> on how text rules work.</p>
            {#if !$successfulBuild}
                <p class="text-cyan-500 text-xs">{$errorMessage}</p>
            {/if}
        </section>
        <section class="bg-neutral-800/30">
            {#key $rules}
                {#each model as rule}
                    <RuleComponent {rule}/>
                {/each}
            {/key}
        </section>
<!--        <section class="text-sm bg-gray-800/30 *:inline-block *:bg-neutral-800 *:p-2">-->
<!--            <div>-->
<!--                <span class="mr-2">Size:</span>-->
<!--                <input class="w-12" min="4" max="1024" type="number" value="128">-->
<!--                <span>X</span>-->
<!--                <input class="w-12" min="4" max="1024" type="number" value="128">-->
<!--            </div>-->
<!--            <div>-->
<!--                <span class="mr-2">Display Mode:</span>-->
<!--                <select>-->
<!--                    <option>2D</option>-->
<!--                    <option disabled>3D</option>-->
<!--                </select>-->
<!--            </div>-->
<!--            <div>-->
<!--                <span class="mr-2">Compute On:</span>-->
<!--                <select>-->
<!--                    <option>CPU (slow!)</option>-->
<!--                    <option disabled>GPU</option>-->
<!--                </select>-->
<!--            </div>-->
<!--        </section>-->
    </section>
</div>