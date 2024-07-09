<script lang="ts">
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import {
        width,
        height,
        board,
        type Rule,
        type ValidPattern,
        newBoard,
        type ModelResult,
        type ModelOK
    } from "$lib/index.svelte";
    import WebGPUCanvas from "$lib/components/WebGPUCanvas.svelte";
    import Guide from "$lib/components/Guide.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import { lexModel, parseRules, parseRulesFromTokens } from "$lib/parse";
    import { writable } from "svelte/store";
    import type WebGPURenderer from "$lib/render/webgpu";
    import { palette, paletteAlias } from "$lib/constants";
    import { selectWihGrid, selectWithCell, selectWithSequence } from "$lib/cpu/select";
    import { isEqualArrays, pick } from "$lib/util";

    // TODO: (Reminder) Uint8Array is 0 to 255, so you cannot use them for board indexes
    // TODO: (Reminder) Uint16Array is 0 to 65535, which is suitable for up to 256x256 boards. After that, we need to use Uint32Array

    // TODO: Figure out why TF /wiki needs localStorage??
    // [BBB=RRR RRR>RGR *G*/**G=RGR/RGR *G*/G**=RGR/RGR GG=RG GB=GR RB=RR BR=RR]
    // [B/*>O/* O/*/*>W/*/* (BW>BB W/W/W/W/W/W/W=*/*/*/B/*/*/*) OOOOOOOO/BBBBBBBB=***B****/******** (OW>*O OO/OB>*B/** OOOO/BBBB/OOOO=**B*/****/**** WW/BB/OB=*O/**/**)]
    // (*BB/WBB/*BB>***/GW*/*G* BBGGBB>GGBBGG)
    // (BW=WB BBUW=BBWW U=R RW=WG GW=WG GB=RR BBWBB=RBWBB R=U)
    // const model = parseRules("(RBB=WWR R*W=W*R)")
    // const model = parseRules("(RBB=GGR RGG=WWR)")
    // const model = parseRules("(RBB=**R)")
    // const model = parseRules("(W=R B=W)")
    let steps = $state(0)
    let stepPerformance = $state(0)
    let traversalsPerIntervalInputRaw = $state(1);

    // TODO: We can't change variables that are imported, so this is a workaround
    let s_width = $state(width)
    let s_height = $state(height)

    let traversalsPerIntervalSys = $derived(Math.floor(traversalsPerIntervalInputRaw ** 1.5))
    // let intervalInput = writable(50)
    // let interval = derived(intervalInput, (v) => v * 16)
    // let intervalSys = 16
    let interval = 16

    const b = $state(5);

    let playing = $state(true)

    let renderer: WebGPURenderer;
    // TODO: It's not 1 step, change this to a better name
    const step = () => {
        const t1 = performance.now()
        for (let i = 0; i < traversalsPerIntervalSys; i++) {
            // TODO: Remove this type assertion
            for (let j = 0; j < (model as ModelOK).rules.length; j++) {
                traverse((model as ModelOK).rules[j])
            }
        }
        renderer.updateTiles(board)
        const t2 = performance.now()

        steps += traversalsPerIntervalSys
        stepPerformance = t2 - t1
    }

    const init = (r: WebGPURenderer) => {
        renderer = r;
        r.updateColours(palette)
        // console.log(model)

        restart()
        setInterval(() => {
            if (playing && model.ok) {
                step()
            }
        }, interval)
    }

    const debug = (chance: number, ...text: unknown[]) => (Math.random() < chance) && console.log(...text)
    const setBoardIndex = (index: number, select: ValidPattern) => {
        const outOfBounds = index < 0 || index >= board.length;
        if (select !== "*" && !outOfBounds) {
            board[index] = paletteAlias[select]
        }
    }

    // Return true if a selection was found
    const traverse = (rule: Rule): boolean => {
        if (rule.group) {
            switch (rule.type) {
                // Difference between Sequence and Markov:
                // Sequence: All children are executed no matter what(?)
                // Markov: If a child found a selection then it is only executed, the rest are ignored
                case "Sequence":
                    for (const child of rule.children) {
                        traverse(child);
                    }
                    break;
                case "Markov":
                    for (const child of rule.children) {
                        const success = traverse(child);
                        if (success) {
                            break;
                        }
                    }
                    break;
            }
        } else {
            let selection;
            switch (rule.select.type) {
                case "Cell":
                    selection = selectWithCell(rule.select)
                    switch (rule.type) {
                        case "All":
                            for (const cellIndex of selection) {
                                setBoardIndex(cellIndex, rule.result.select as ValidPattern)
                            }
                            break;
                        case "One":
                            if (selection.length > 0) {
                                const index = pick(selection);
                                setBoardIndex(index, rule.result.select as ValidPattern)
                            }
                            break;
                    }
                    break;
                case "Sequence":
                    selection = selectWithSequence(rule.select)
                    switch (rule.type) {
                        case "All":
                            for (const sequence of selection) {
                                for (let i = 0; i < sequence.length; i++) {
                                    const index = sequence[i];
                                    const result = rule.result.select[i];
                                    setBoardIndex(index, result as ValidPattern)
                                }
                            }
                            break;
                        case "One":
                            if (selection.length > 0) {
                                const sequence = pick(selection);
                                for (let i = 0; i < sequence.length; i++) {
                                    const index = sequence[i];
                                    const result = rule.result.select[i];
                                    setBoardIndex(index, result as ValidPattern)
                                }
                            }
                            break;
                    }
                    break;
                case "Grid":
                    selection = selectWihGrid(rule.select)
                    // debug(1e-2, rule.select)
                    switch (rule.type) {
                        case "All":
                            for (const grid of selection) {
                                const gridWidth = grid.length;
                                const gridHeight = grid[0].length;

                                for (let x = 0; x < gridWidth; x++) {
                                    for (let y = 0; y < gridHeight; y++) {
                                        const index = grid[x][y];
                                        const result = rule.result.select[x][y];
                                        setBoardIndex(index, result as ValidPattern)
                                    }
                                }
                            }
                            break;
                        case "One":
                            if (selection.length > 0) {
                                const grid = pick(selection);
                                const gridWidth = grid.length;
                                const gridHeight = grid[0].length;

                                for (let x = 0; x < gridWidth; x++) {
                                    for (let y = 0; y < gridHeight; y++) {
                                        const index = grid[x][y];
                                        const result = rule.result.select[x][y];
                                        setBoardIndex(index, result as ValidPattern)
                                    }
                                }
                            }
                            break;
                    }
                    break;
            }

            return selection.length > 0;
        }

        // TODO: What's the appropriate return value for this?
        return true;
    }

    const pause = () => {
        playing = !playing
    }

    const restart = () => {
        steps = 0
        board.fill(0)
        // DEBUG
        // board[getIndexOfBoardCoordinate(width / 2, height / 2)] = paletteAlias["R"]
        renderer?.updateTiles(board)
    }

    // let pastTokens: string[] = [];
    const setModel = (newModel: string): ModelResult => {
        try {
            const tokens = lexModel(newModel);

            // To avoid restarts, check if the new model gives the same tokens as the last one.
            // if (isEqualArrays(pastTokens, tokens)) return {error: false, model};
            const rules = parseRulesFromTokens(tokens);

            // pastTokens = tokens;
            localStorage.setItem("model", newModel)

            // Finally, return
            return {ok: true, rules};
        } catch (e) {
            console.error(e)
            return {ok: false, failReason: e};
        }
    }

    let rules = $state(localStorage.getItem("model") ?? "")
    let model = $derived(setModel(rules))
    $inspect(model).with(() => {
        console.log("New model:", model)
        restart()
    })
    $effect(() => {
        // Update whenever the rule input element changes
        setModel(rules)

        // Resize whenever width or height changes
        newBoard(s_width, s_height)
        renderer?.resize(s_width, s_height)
    })
</script>

<div class="flex w-full *:w-1/2 gap-2 p-5">
<!--    <dialog open class="w-full h-full bg-neutral-600/50 backdrop-blur-xs">-->
<!--    <dialog class="invisible absolute top-0 flex justify-center items-center z-10 w-full h-full bg-neutral-900/80">-->
<!--        <Guide/>-->
<!--    </dialog>-->
	<section>
        <section class="flex justify-center gap-2 font-bold text-neutral-300 *:grow *:bg-neutral-800/40 *:px-2 *:py-1">
            <div>
                <span>Size:</span>
<!--                TODO: 512 is arbitrary, increase it in the future -->
                <input required min="1" max="256" class="w-12 text-blue-500 font-black text-center" bind:value={s_width}>
                <span>X</span>
                <input required min="1" max="256" class="w-12 text-pink-500 font-black text-center" bind:value={s_height}>
            </div>
            <div>
                <span>Steps:</span>
                <span class="text-green-500 font-black">{steps.toLocaleString()}</span>
            </div>
            <div>
                <span>Step time:</span>
                <span class="text-amber-500 font-black">{stepPerformance.toLocaleString()}ms</span>
            </div>
        </section>
        <section class="flex gap-2 text-sm py-2 *:grow *:inline-block *:bg-neutral-800 *:p-2">
            <div>
                <span class="mr-2">Display Mode:</span>
                <select>
                    <option>2D</option>
                    <option disabled>3D</option>
                </select>
            </div>
            <div>
                <span class="mr-2">Compute On:</span>
                <select>
                    <option>CPU</option>
                    <option disabled>GPU</option>
                </select>
            </div>
        </section>
        <WebGPUCanvas {init}/>
        <section class="flex *:grow m-5 gap-2 justify-around">
            <button onclick={pause}>{playing ? "⏸︎" : "⏵"}</button>
            <button onclick={step}>	⏭</button>
            <button onclick={restart}>🔁</button>
        </section>
        <section class="flex gap-2 items-center font-bold">
            <span>Traversals per step:</span>
            <input type="range" min="1" max="100" bind:value={traversalsPerIntervalInputRaw} step="1"/>
            <span>{traversalsPerIntervalSys}</span>
        </section>
    </section>
	<section class="mx-2 *:p-2 *:mb-2">
        <section class="bg-cyan-950/80">
            <Editor bind:code={rules}/>
            <p class="text-xs text-right text-cyan-400 pt-2">Check out this <a>short guide</a> on how text rules work.</p>
            {#if !model.ok}
                <p class="text-cyan-500 text-xs">{model.failReason}</p>
            {/if}
        </section>
        <section class="bg-neutral-800/30 overflow-x-auto">
            {#if model.ok}
                {#each model.rules as rule}
                    <RuleComponent {rule}/>
                {/each}
            {/if}
        </section>
    </section>
</div>