<script lang="ts">
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import { parseRules } from "$lib/parse";

    let {model}: {model: string} = $props()
</script>

<div>
    <p class="bg-neutral-900/60 text-xs text-center font-bold font-mono py-1 mb-4">{model}</p>
    <RuleComponent rule={parseRules(model)[0]}/>
</div>