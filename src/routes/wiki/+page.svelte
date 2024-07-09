<script lang="ts">
    import { groupSections, parseRaw } from "$lib/wiki";
    import indexRaw from "$lib/index.svelte.ts?raw";
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import { parseRules } from "$lib/parse";
    import ExampleRuleComponent from "$lib/components/ExampleRuleComponent.svelte";

    const sections = parseRaw(indexRaw)
    const groups = Object.entries(groupSections(sections))
    // console.log(sections)
</script>

{#snippet info()}
    <section class="text-xs text-neutral-400 text-center">
        <p>Click on any example to run it</p>
        <span>0.1.0</span>
        <span>•</span>
<!--        <a href="/changelog">Changelog</a>-->
<!--        <span>•</span>-->
        <a>Github</a>
        <span>•</span>
        <a>Discord</a>
    </section>
{/snippet}

<section class="flex">
    <section class="w-1/5 h-full bg-neutral-800 p-2">
        <h1 class="italic">Wiki!</h1>
        {@render info()}
        {#each groups as [name, group]}
            <hr class="mx-2">
            <h3 class="ml-3"><a href="/wiki/#{name}">> {name}</a></h3>
            {#each group as section}
                {#if section.since}
                    <p class="ml-10"><a class="font-normal" href="/wiki/#{section.title}">{section.title}</a></p>
                {/if}
            {/each}
        {/each}
    </section>
    <section class="w-4/5 p-5">
        {#each groups as [name, group]}
            <h1 id="name"><a class="font-black" href="/wiki/#{name}">{name}</a></h1>
            <div class="flex flex-col gap-8">
                {#each group as section}
                    <!-- TODO: Implement section.todo-->
                    {#if section.since}
                        <section class="bg-gray-950/30 rounded p-3">
                            <div class="flex">
                                <h2 id={section.title} class="text-left"><a href="/wiki/#{section.title}">{section.title}</a></h2>
                                <span class="text-xs">{section.since}</span>
                            </div>
                            <p class="text-neutral-300">{section.description}</p>
                            {#if section.example}
                                <div class="inline-block bg-gray-950/20 outline outline-1 outline-gray-400 rounded p-2 m-2">
                                    <ExampleRuleComponent model={section.example}/>
                                    <p class="text-xs opacity-25">example</p>
                                </div>
                            {/if}
                        </section>
                    {/if}
                {/each}
            </div>
            <hr>
        {/each}
    </section>
</section>
