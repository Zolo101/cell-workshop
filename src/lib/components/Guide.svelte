<script lang="ts">
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import PatternComponent from "$lib/components/PatternComponent.svelte";
</script>

{#snippet rule(model, color)}
    <div class="inline-block bg-{color}-900/40 outline outline-1 outline-{color}-500 rounded p-2 m-4">
        <RuleComponent {model} rule={null}/>
    </div>
{/snippet}

<div class="w-2/3 h-4/5 overflow-auto text-sm text-neutral-200 bg-zinc-900 outline outline-1 outline-neutral-400 p-5">
    <h1>Welcome to <i>Collapsibles!</i></h1>
    <p class="text-center mb-2">Algorithms are created from rules, and rules are created from two patterns, an input and output. Each step, the rule's input pattern will look at the screen and collect all regions that match the pattern. It will then replace that region with the output pattern.</p>
    <p>The "Markov" algorithm will attempt to run each rule until one succeeds, skipping the rest.</p>
    <hr>
    <div class="flex flex-col items-center">
        <PatternComponent accessibility pattern={{type: "Sequence", select: ["B", "I", "P", "E", "N", "D", "A", "W", "R", "O", "Y", "G", "U", "S", "K", "F", "*"]}}/>
    </div>
    <hr>
<!--    TODO: Replace all <b> with <strong> -->
    <p>Patterns can be a <strong>cell</strong>, <strong>sequence</strong> or <strong>grid</strong>!</p>
    <div class="grid grid-cols-3">
        {@render rule("(B=W)", "blue")}
        {@render rule("(WB=BW)", "cyan")}
        {@render rule("(BB/BW=WW/WW)", "emerald")}
        <p>Replaces black with white</p>
        <p>Moves white forward in a random direction</p>
        <p>Grows white pixels to neighbours</p>
    </div>
    <hr>
    <h2>Wildcards</h2>
    <p>By using the asterisk <code>*</code>, you can give a pattern a wildcard. On an input pattern, this will match any colour. On an output pattern, this will not replace anything.</p>
    <div class="grid grid-cols-2">
        {@render rule("(*=W)", "violet")}
        {@render rule("(RW=U*)", "purple")}
        <p>Replaces <strong>ANYTHING</strong> with white</p>
        <p>Replaces red with blue if its next to white</p>
    </div>
    <hr>
    <div class="grid grid-cols-2">
        <h2>Multiple Rules</h2>
        <h2>All</h2>
        <p>You can create multiple rules simply by separating them with a space.</p>
        <p>If you want a rule to replace ALL occurrences of a pattern, use <code>></code></p>
        <div class="grid grid-cols-1">
            {@render rule("(RBB=GGR RGG=WWR)", "pink")}
            <p>Creates a maze!</p>
        </div>
        <div class="grid grid-cols-1">
            {@render rule("(B=W W>R)", "red")}
            <p>Slowly replace each black pixel to white, and once there are none left, turn the screen red!</p>
        </div>
    </div>
    <p class="text-center">For more info, check out the <a href="/wiki">wiki!</a> You can also click on text in any rule visualiser</p>
<!--    <h1>Advanced Features</h1>-->
<!--    <h2>Markov & Sequence</h2>-->
<!--    <table class="w-full">-->
<!--        <thead>-->
<!--            <tr>-->
<!--                <th>Type</th>-->
<!--                <th>Description</th>-->
<!--                <th>Notation</th>-->
<!--            </tr>-->
<!--        </thead>-->
<!--        <tbody>-->
<!--            <tr>-->
<!--                <td>Markov</td>-->
<!--                <td>Will attempt to run each rule until one succeeds, skipping the rest.</td>-->
<!--                <td>()</td>-->
<!--            </tr>-->
<!--            <tr>-->
<!--                <td>Sequence</td>-->
<!--                <td>Will attempt to run each rule regardless if it succeeds or not.</td>-->
<!--                <td>[]</td>-->
<!--            </tr>-->
<!--        </tbody>-->
<!--    </table>-->
<!--    <h2>All vs One</h2>-->
<!--    <table class="w-full">-->
<!--        <thead>-->
<!--        <tr>-->
<!--            <th>Type</th>-->
<!--            <th>Description</th>-->
<!--            <th>Notation</th>-->
<!--        </tr>-->
<!--        </thead>-->
<!--        <tbody>-->
<!--        <tr>-->
<!--            <td>All</td>-->
<!--            <td>Will replace all found regions that match.</td>-->
<!--            <td>></td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--            <td>One</td>-->
<!--            <td>Will pick a randomly found region that matches.</td>-->
<!--            <td>=</td>-->
<!--        </tr>-->
<!--        </tbody>-->
<!--    </table>-->
    <form method="dialog" class="flex justify-center m-2">
        <button>Let's Start!</button>
    </form>
</div>

<style>
    .grid {
        @apply mb-4;
    }
    .grid > p {
        @apply text-xs text-center;
    }
</style>