<script lang="ts">
    import { type Rule } from "$lib/index.svelte";
    import PatternComponent from "$lib/components/PatternComponent.svelte";

    let {rule}: {rule: Rule | null} = $props();
</script>

{#snippet wiki(id)}
    <a class="font-normal" href="/wiki#{id}">{id}</a>
{/snippet}

{#if rule}
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
        <section class="grid grid-cols-[50px_1fr] grid-flow-row mb-2 items-center">
            <span class="type">{@render wiki(rule.type)}</span>
            <div class="flex gap-2 items-center align-middle" class:omnidirectional={rule.omnidirectional}>
                <PatternComponent pattern={rule.select}/>
                <span class="relative bottom-0.5 text-sm font-black">⟶</span>
                <PatternComponent pattern={rule.result}/>
                {#if rule.omnidirectional}
                    <span class="text-blue-200/75 text-xs italic ml-auto">any rotation</span>
                {/if}
            </div>
        </section>
    {/if}
{/if}

<style>
    .type {
        @apply text-xs text-center bg-neutral-900/75 p-1 mr-3;
    }

    .omnidirectional {
        @apply bg-blue-500/10 p-2;
    }
</style>