<script lang="ts">
    import RuleComponent from "$lib/components/RuleComponent.svelte";
    import {
        type Rule,
        type ModelResult,
        type ModelOK,
        type Renderer
    } from "$lib/index.svelte";
    import WebGPUCanvas from "$lib/components/WebGPUCanvas.svelte";
    import Guide from "$lib/components/Guide.svelte";
    import Editor from "$lib/components/Editor.svelte";
    import { lexModel, parseRulesFromTokens } from "$lib/parse";
    import { palette, type ValidCode } from "$lib/constants";
    import { pick } from "$lib/util";
    import WebGL2Canvas from "$lib/components/WebGL2Canvas.svelte";
    import RendererSelector from "$lib/cpu/select";

    // TODO: (Reminder) Uint8Array is 0 to 255, so you cannot use them for board indexes
    // TODO: (Reminder) Uint16Array is 0 to 65535, which is suitable for up to 256x256 boards. After that, we need to use Uint32Array
    // TODO: (Reminder) Uint32Array is 0 to 4294967295, which is suitable for up to 65535x65535 boards.

    // (
    // BB/BB=WW/WW B>A
    //     [
    //     A/W=W/A *A/WA=*W/A* A*/AW=W*/*A
    // ]
    // )
    // [BBB=RRR RRR>RGR *G*/**G=RGR/RGR *G*/G**=RGR/RGR GG=RG GB=GR RB=RR BR=RR]
    // [B/*>O/* O/*/*>W/*/* (BW>BB W/W/W/W/W/W/W=*/*/*/B/*/*/*) OOOOOOOO/BBBBBBBB=***B****/******** (OW>*O OO/OB>*B/** OOOO/BBBB/OOOO=**B*/****/**** WW/BB/OB=*O/**/**)]
    // (*BB/WBB/*BB>***/GW*/*G* BBGGBB>GGBBGG)
    // (BW=WB BBUW=BBWW U=R RW=WG GW=WG GB=RR BBWBB=RBWBB R=U)
    // (R=R B=R) (RB>RG BR>GR R/B>R/G B/R>G/R) (GB>GR BG>RG)
    // const model = parseRules("(RBB=WWR R*W=W*R)")
    // const model = parseRules("(RBB=GGR RGG=WWR)")
    // const model = parseRules("(RBB=**R)")
    // const model = parseRules("(W=R B=W)")
    let steps = $state(0)
    let stepPerformance = $state(0)
    let traversalsPerIntervalInputRaw = $state(1);

    // TODO: We can't change variables that are imported, so this is a workaround
    let s_width = $state(64)
    // let s_height = $state(64 * 2)

    let traversalsPerIntervalSys = $derived(Math.floor(traversalsPerIntervalInputRaw ** 1.5))
    // let intervalInput = writable(50)
    // let interval = derived(intervalInput, (v) => v * 16)
    // let intervalSys = 16
    let interval = 16
    let playing = $state(true)

    let renderer: Renderer;
    let selector: RendererSelector;
    // TODO: It's not 1 step, change trhis to a better name
    const step = () => {
        const t1 = performance.now()
        for (let i = 0; i < traversalsPerIntervalSys; i++) {
            // TODO: Remove this type assertion
            for (let j = 0; j < (model as ModelOK).rules.length; j++) {
                traverse((model as ModelOK).rules[j])
            }
        }
        renderer.updateTiles()
        const t2 = performance.now()

        steps += traversalsPerIntervalSys
        stepPerformance = t2 - t1
    }

    const init = (r: Renderer) => {
        renderer = r;
        selector = new RendererSelector(renderer);
        r.updateColours(palette)
        // console.log(model)

        restart()

        window.requestAnimationFrame(frame)
    }

    const frame = (delta: number) => {
        if (playing && model.ok) {
            step()
        }

        window.requestAnimationFrame(frame)
    }

    const debug = (chance: number, ...text: unknown[]) => (Math.random() < chance) && console.log(...text)
    const setBoardIndex = (index: number, select: ValidCode) => {
        const outOfBounds = index < 0 || index >= renderer.board.length;
        if (!outOfBounds && select !== 16) {
            renderer.board[index] = select
        }
    }

    // Return true if a selection was found
    const traverse = (rule: Rule): boolean => {
        if (rule.group) {
            switch (rule.type) {
                // Difference between Sequence and Search:
                // Sequence: All children are executed no matter what
                // Search: If a child found a selection then it is only executed, the rest are ignored
                case "Sequence":
                    let successful = false;
                    for (const child of rule.children) {
                        // TODO: We cant shorthand "&&=" this for some reason..?
                        let success = traverse(child);
                        if (success === true) {
                            successful = true;
                        }
                    }
                    return successful;
                case "Search":
                    return rule.children.some(traverse);
                    // let anySuccess = false;
                    // for (const child of rule.children) {
                    //     const success = traverse(child);
                    //     if (success) {
                    //         anySuccess = true;
                    //         break;
                    //     }
                    // }
                    // return anySuccess;
            }
        } else {
            let selection;
            switch (rule.select.type) {
                case "Cell":
                    selection = selector.selectWithCell(rule.select)
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
                    selection = selector.selectWithSequence(rule.select, rule.omnidirectional)
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
                    const gridWidth = rule.result.select.length;
                    const gridHeight = rule.result.select[0].length;
                    selection = selector.selectWithGrid(rule.select, rule.omnidirectional)
                    // debug(1e-2, rule.select)
                    switch (rule.type) {
                        case "All":
                            for (const grid of selection) {
                                for (let x = 0; x < gridWidth; x++) {
                                    for (let y = 0; y < gridHeight; y++) {
                                        const index = grid[x * gridWidth + y];
                                        const result = rule.result.select[x][y];
                                        setBoardIndex(index, result as ValidPattern)
                                    }
                                }
                            }
                            break;
                        case "One":
                            if (selection.length > 0) {
                                const grid = pick(selection);
                                for (let x = 0; x < gridWidth; x++) {
                                    for (let y = 0; y < gridHeight; y++) {
                                        const index = grid[x * gridWidth + y];
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
    }

    const pause = () => {
        playing = !playing
    }

    const restart = () => {
        steps = 0
        renderer?.board.fill(0)
        // DEBUG
        // board[getIndexOfBoardCoordinate(width / 2, height / 2)] = paletteAlias["R"]
        renderer?.updateTiles()
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

    // let settings = $derived(JSON.parse(localStorage.getItem("settings") ?? JSON.stringify({
    //     width,
    //     height,
    //     display: "2d",
    //     compute: "cpu"
    // })))

    let rules = $state(localStorage.getItem("model") ?? "")
    let model = $derived(setModel(rules))
    $inspect(model).with(() => {
        console.log("New model:", model)
        restart()
    })
    $effect(() => {
        // Update whenever the rule input element changes
        setModel(rules)

        // Update whenever settings change
        // localStorage.setItem("settings", JSON.stringify(settings))

        // Resize whenever width or height changes
        renderer?.resize(s_width, s_width)
    })

    // setInterval(() => {
    //     let x = ~~(Math.random() * s_width)
    //     let y = ~~(Math.random() * s_width)
    //
    //     renderer?.resize(x, y)
    // }, 1000)

    let dialog: HTMLDialogElement;
</script>

<!--<dialog open class="w-full h-full bg-neutral-600/50 backdrop-blur-xs">-->
<dialog bind:this={dialog} class="z-20 absolute top-0 flex justify-center items-center w-full h-full bg-neutral-900/80">
    <Guide/>
</dialog>
<div class="flex max-md:flex-col w-full md:*:w-1/2 gap-2 p-5">
	<section>
        <section class="flex justify-center gap-2 font-bold text-neutral-300 pb-2 *:w-full *:bg-neutral-800/40 *:px-2 *:py-1">
            <div>
                <span>Size:</span>
<!--                TODO: 256 is arbitrary, increase it in the future -->
                <input type="number" required min="1" max="1024" class="w-12 text-blue-500 font-black text-center" bind:value={s_width}>
                <span>X</span>
<!--                TODO: Non-square sizes don't work for now... see Renderer-->
                <input type="number" required min="1" max="1024" class="w-12 text-pink-500 font-black text-center" bind:value={s_width}>
            </div>
            <div>
                <span>Steps:</span>
                <span class="text-green-500 font-black">{steps.toLocaleString()}</span>
            </div>
            <div>
                <span>Step time:</span>
                <span class="text-amber-500 font-black">{stepPerformance.toLocaleString(undefined, {minimumFractionDigits: 3})}ms</span>
            </div>
        </section>
<!--        <section class="flex gap-2 text-sm py-2 *:grow *:inline-block *:bg-neutral-800 *:p-2">-->
<!--            <div>-->
<!--                <span class="mr-2">Display Mode:</span>-->
<!--&lt;!&ndash;                <select bind:value={settings.display}>&ndash;&gt;-->
<!--                <select>-->
<!--                    <option value="2d">2D</option>-->
<!--                    <option value="3d" disabled>3D (planned)</option>-->
<!--                </select>-->
<!--            </div>-->
<!--            <div>-->
<!--                <span class="mr-2">Compute On:</span>-->
<!--&lt;!&ndash;                <select bind:value={settings.compute}>&ndash;&gt;-->
<!--                <select>-->
<!--                    <option value="cpu">CPU</option>-->
<!--                    <option value="gpu" disabled>GPU (planned)</option>-->
<!--                </select>-->
<!--            </div>-->
<!--            <div>-->
<!--                <span class="mr-2">API:</span>-->
<!--                <select disabled>-->
<!--                    <option value="webgl2">WebGL2</option>-->
<!--                    <option value="webgpu">WebGPU</option>-->
<!--                </select>-->
<!--            </div>-->
<!--        </section>-->
        <WebGL2Canvas {init}/>
<!--        <WebGPUCanvas {init}/>-->
        <section class="flex *:grow m-5 gap-2 justify-around">
            <button onclick={pause}>{playing ? "⏸︎" : "⏵"}</button>
            <button onclick={step}>	⏭</button>
            <button onclick={restart}>🔁</button>
        </section>
        <section class="flex gap-2 items-center font-bold">
            <span>Traversals per step:</span>
            <input type="range" min="1" max="100" bind:value={traversalsPerIntervalInputRaw} step="1"/>
            <span>{traversalsPerIntervalSys}</span>
<!--            <input type="range" min="0" max="100" bind:value={traversalsPerIntervalInputRaw} step="1"/>-->
<!--            <span>{traversalsPerIntervalSys ? traversalsPerIntervalSys : "Auto"}</span>-->
        </section>
    </section>
	<section class="mx-2 *:p-2 *:mb-2">
        <section class="bg-cyan-950/80">
            <Editor bind:code={rules}/>
            <div class="flex justify-between items-center my-1">
                {#if !model.ok}
                    <p class="text-cyan-500 text-xs">{model.failReason}</p>
                {:else}
                    <p class="text-cyan-500 text-xs"></p>
                {/if}
                <button class="z-10 bg-neutral-800/50 hover:bg-neutral-600/50 outline-neutral-400/30 text-xs" onclick={() => dialog.show()}>Guide</button>
            </div>
        </section>
        <section class="relative bg-neutral-800/30 overflow-x-auto z-10">
            {#if model.ok}
                {#each model.rules as rule}
                    <RuleComponent {rule}/>
                {/each}
            {/if}
        </section>
    </section>
</div>