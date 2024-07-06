<script lang="ts">
    import { type Rule } from "$lib";
    import PatternComponent from "$lib/components/PatternComponent.svelte";
    import { parseRules } from "$lib/parse";

    export let model: string;
    export let rule: Rule | null;

    if (!rule) rule = parseRules(model)[0];
</script>

{#snippet wiki(id)}
    <a class="font-normal" href="/wiki#{id}">{id}</a>
{/snippet}

{#if model}
    <p class="bg-neutral-900/60 text-xs text-center font-bold font-mono py-1 mb-4">{model}</p>
{/if}
{#if rule.group}
    <section>
    	<p class="type inline-block mb-1">{@render wiki(rule.type)}</p>
        <div class="ml-8">
            {#each rule.children as item}
                <svelte:self rule={item}/>
            {/each}
        </div>
    </section>
{:else}
    <section class="grid grid-cols-[50px_1fr] grid-flow-row mt-1 items-center">
    	<span class="type mb-2">{@render wiki(rule.type)}</span>
        <div class="flex gap-2 items-center">
            <PatternComponent pattern={rule.select}/>
    	    <span class="relative bottom-0.5 text-sm font-black">⟶</span>
            <PatternComponent pattern={rule.result}/>
        </div>
    </section>
{/if}

<style>
    .type {
        @apply text-xs text-center bg-neutral-900/75 p-1 mr-3;
    }
</style>