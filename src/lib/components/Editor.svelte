<script lang="ts">
    import { onMount } from "svelte";
    import ModelColorCoded from "$lib/components/ModelColorCoded.svelte";

    let { code = $bindable() }: {code: string} = $props();

    onMount(() => {
        code = localStorage.getItem("model") ?? "(B=W)"
        resize();
    })

    const resize = () => {
        // Unfortunately because of textarea being absolute, I think this is the only way to get the width to match.
        const textarea = document.querySelector<HTMLTextAreaElement>("#ta")!;
        const pre = document.querySelector<HTMLPreElement>("#c")!;

        textarea.style.width = `${pre.clientWidth}px`;
    }

    window.addEventListener("resize", resize)
</script>

<div class="bg-neutral-800 w-full pb-5">
    <textarea id="ta" bind:value={code}></textarea>
    <pre id="c"><code class="whitespace-pre"><ModelColorCoded {code}/></code></pre>
    <!--{#await codeAI}-->
    <!--{:then codeAI}-->
    <!--    <p class="absolute font-mono opacity-50">{codeAI}</p>-->
    <!--{/await}-->
</div>

<style>
    textarea {
        @apply h-1/2 absolute resize-none text-transparent bg-transparent caret-white border-none shadow-none overflow-auto outline-none p-0 m-0;
    }
    pre {
        @apply text-neutral-200 whitespace-normal;
    }

    textarea, pre {
        @apply font-mono p-2;
    }
</style>