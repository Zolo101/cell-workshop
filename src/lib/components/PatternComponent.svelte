<script lang="ts">
    import { type Pattern, type ValidPattern } from "$lib/index.svelte";
    import { palette, paletteAlias } from "$lib/constants";

    export let pattern: Pattern;

    // TODO: Give a better name
    export let accessibility = false;
</script>

{#snippet icon(char: ValidPattern)}
    {@const color = palette[paletteAlias[char]]}
    {@const RGB = `rgb(${color[0]}, ${color[1]}, ${color[2]})`}
    {@const invertRGB = `rgb(${300 - color[0]}, ${300 - color[1]}, ${300 - color[2]})`}
    {#if char === "*"}
        <div class="inline-block outline-1 outline-dotted bg-transparent w-6 h-6">
            {#if accessibility}
                <p class="font-black text-center">all</p>
            {/if}
        </div>
    {:else}
        <div class="inline-block outline outline-1 outline-neutral-200 w-6 h-6" style="background-color: {RGB}">
            {#if accessibility}
                <p class="font-black text-center" style="color: {invertRGB}">{char}</p>
            {/if}
        </div>
    {/if}
{/snippet}


<!-- TODO: Do we need the section tags? -->
{#if pattern.type === "Cell"}
    {@render icon(pattern.select)}
{:else if pattern.type === "Sequence"}
    <section class="flex">
        {#each pattern.select as select}
            {@render icon(select)}
        {/each}
    </section>
{:else if pattern.type === "Grid"}
    <section>
        {#each pattern.select as row}
            <div class="flex">
                {#each row as select}
                    {@render icon(select)}
                {/each}
            </div>
        {/each}
    </section>
{/if}
