<script lang="ts">
    import PatternComponent from "$lib/components/PatternComponent.svelte";
    import ExampleRuleComponent from "$lib/components/ExampleRuleComponent.svelte";
</script>

{#snippet rule(model, color)}
    <div class="inline-block bg-{color}-900/40 outline outline-1 outline-{color}-500 rounded p-2 m-4">
        <ExampleRuleComponent {model}/>
    </div>
{/snippet}

<div class="w-2/3 h-4/5 overflow-auto text-sm text-neutral-200 bg-zinc-900 outline outline-1 outline-neutral-400 p-5">
    <form method="dialog" class="float-right">
        <button>Close</button>
    </form>
    <h1>Welcome to the <i>Cell Workshop!</i></h1>
    <p class="text-center mb-2">Algorithms are created from rules, and rules are created from two patterns, an input and output. Each step, the rule's input pattern will look at the screen and collect all regions that match the pattern. It will then replace that region with the output pattern.</p>
    <p>The "Search" algorithm will attempt to run rules from left to right until one succeeds, then quit.</p>
    <hr>
    <div class="flex flex-col items-center *:w-full *:flex *:*:grow *:*:h-5">
<!--        TODO: Make this show letters instead-->
        <PatternComponent accessibility pattern={{type: "Sequence", select: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}}/>
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
    <hr>
    <h2>Sequences</h2>
    <p>If you want to have rules run independent of them being successful, use sequences!</p>
    <div class="grid grid-cols-1">
        {@render rule("[B=W B=U]", "amber")}
        <p>Replaces black with white and blue</p>
    </div>
    <hr>
    <h2>Omnidirectional</h2>
    <p>By prefixing an algorithm with <code>~</code>, it will match, disregarding the pattern's direction.</p>
    <div class="grid grid-cols-1">
        {@render rule("[B=W WB/WB~=AA/AA]", "stone")}
        <p>(TODO: REPLACE TEXT)</p>
    </div>
    <hr>
    <p class="text-center">For more info, check out the <a href="./wiki/">wiki!</a> You can also click on text in any rule visualiser for more information.</p>
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