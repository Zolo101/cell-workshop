<script lang="ts">
    import { type Pattern, type ValidPattern } from "$lib";
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
        <div class="inline-block outline outline-1 outline-dotted bg-transparent w-6 h-6">
            {#if accessibility}
                <p class="font-black text-center">all</p>
            {/if}
        </div>
    {:else}
        <div class="inline-block outline outline-1 w-6 h-6" style="background-color: {RGB}">
            {#if accessibility}
                <p class="font-black text-center" style="color: {invertRGB}">{char}</p>
            {/if}
        </div>
    {/if}
{/snippet}

<section>
    {#if pattern.type === "Cell"}
        {@render icon(pattern.select)}
    {:else if pattern.type === "Sequence"}
        {#each pattern.select as select}
            {@render icon(select)}
        {/each}
    {:else if pattern.type === "Grid"}
        {#each pattern.select as row}
            <div class="flex">
                {#each row as select}
                    {@render icon(select)}
                {/each}
            </div>
        {/each}
    {/if}
</section>
