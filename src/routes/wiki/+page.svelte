<script lang="ts">
    // @ts-ignore
    import indexRaw from "$lib/index.svelte.ts?raw";
    import ExampleRuleComponent from "$lib/components/ExampleRuleComponent.svelte";
    import { version } from "$lib/constants";

    type Section = Partial<Record<string, string>>
    type SectionGroup = Record<string, Section[]>

    const parseRaw = (raw: string) => {
        const sections: Section[] = [];
        let currentSection: Section = {}

        const lines = raw.split("\n");
        for (const line of lines) {
            const jsDoc = line.match(/^ \* @(\w+)\s(.+)/);
            if (line === "/**") currentSection = {}
            if (jsDoc) {
                const [, key, value] = jsDoc;
                currentSection[key] = value;
            }
            if (line === " */") sections.push(currentSection)
        }

        return sections;
    }

    const groupSections = (sections: Section[]) => {
        const groups: SectionGroup = {};
        for (const section of sections) {
            let group = section.group;
            if (!group) {
                group = "Ungrouped"
            }
            // Create array if this is a new group name
            if (!groups[group]) groups[group] = [];
            groups[group].push(section);
        }

        return groups;
    }

    const sections = parseRaw(indexRaw)
    const groups = Object.entries(groupSections(sections))
    // console.log(sections)
</script>

<svelte:head>
    <title>Cell Workshop Wiki</title>
    <link rel="icon" href="./wiki/favicon.png"/>
</svelte:head>

{#snippet info()}
    <section class="text-xs text-neutral-400 text-center">
<!--        <p>Click on any example to run it</p>-->
<!--        <span>•</span>-->
<!--        <a href="./changelog">Changelog</a>-->
    </section>
{/snippet}

<section class="flex">
    <section class="w-1/5 sticky top-0 h-full bg-neutral-800/80 p-2">
        <h1 class="italic">Wiki</h1>
        {@render info()}
        {#each groups as [name, group]}
            <hr class="mx-2">
            <h3 class="ml-3"><a href="./wiki/#{name}">> {name}</a></h3>
            {#each group as section}
                {#if section.since}
                    <p class="ml-10"><a class="font-normal" href="./wiki/#{section.title}">{section.title}</a></p>
                {/if}
            {/each}
        {/each}
    </section>
    <section class="w-4/5 p-5">
        {#each groups as [name, group]}
            <h1 id="name"><a class="font-black" href="./wiki/#{name}">{name}</a></h1>
            <div class="flex flex-col gap-8">
                {#each group as section}
                    <!-- TODO: Implement section.todo-->
                    {#if section.since}
                        <section class="bg-gray-950/30 rounded p-3">
                            <div class="flex">
                                <h2 id={section.title} class="text-left"><a href="./wiki/#{section.title}">{section.title}</a></h2>
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
