import type WebGPURenderer from "$lib/render/webgpu";
import { writable } from "svelte/store";
import { lexModel, parseRules, parseRulesFromTokens } from "$lib/parse";
import { palette, paletteAlias } from "$lib/constants";

type Node = {
    type: string
    group: boolean
}

export type ValidPattern = keyof typeof paletteAlias
type PatternNode = {
    type: string
}

type PatternCell = PatternNode & {type: "Cell", select: ValidPattern}
type PatternSequence = PatternNode & {type: "Sequence", select: ValidPattern[]}
type PatternGrid = PatternNode & {type: "Grid", select: ValidPattern[][]}

export type Pattern = PatternCell | PatternSequence | PatternGrid

type Singlet = Node & {
    group: false,
    select: Pattern
    result: Pattern // TODO: Better name for this?
}

type Group = Node & {
    group: true,
    children: Rule[]
    options?: {
        origin?: boolean
    }
}

/**
 * @title All
 * @description All cells that match the select pattern will be replaced with the result pattern.
 * @since 0.1.0
 * @example (B>W)
 * @group Rule
 */
type AllSinglet = Singlet & { type: "All" }

/**
 * @title One
 * @description A random cell that matches the select pattern will be replaced with the result pattern.
 * @since 0.1.0
 * @example (B=W)
 * @group Rule
 */
type OneSinglet = Singlet & { type: "One" }

/**
 * @title Sequence
 * @description Will attempt to run each rule regardless if it succeeds or not.
 * @group Group
 *
 * @todo
 */
type SequenceGroup = Group & { type: "Sequence" }

/**
 * @title Markov
 * @description Will attempt to run each rule until one succeeds, skipping the rest.
 * @since 0.1.0
 * @example (B=W W>R)
 * @group Group
 */
type MarkovGroup = Group & { type: "Markov" }

export type Rule = AllSinglet | OneSinglet | SequenceGroup | MarkovGroup

enum Direction {
    Up,
    Left,
    Down,
    Right
}

export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const width = 64
export const height = 64
// const board: number[] = new Array(width * height).fill(0);
const board = new Uint8Array(width * height);

// TODO: (Reminder) Uint8Array is 0 to 255, so you cannot use them for board indexes
// TODO: (Reminder) Uint16Array is 0 to 65535, which is suitable for up to 256x256 boards. After that, we need to use Uint32Array

export let model = parseRules("")
// [BBB=RRR RRR>RGR *G*/**G=RGR/RGR *G*/G**=RGR/RGR GG=RG GB=GR RB=RR BR=RR]
// [B/*>O/* O/*/*>W/*/* (BW>BB W/W/W/W/W/W/W=*/*/*/B/*/*/*) OOOOOOOO/BBBBBBBB=***B****/******** (OW>*O OO/OB>*B/** OOOO/BBBB/OOOO=**B*/****/**** WW/BB/OB=*O/**/**)]
// (*BB/WBB/*BB>***/GW*/*G* BBGGBB>GGBBGG)
// (BW=WB BBUW=BBWW U=R RW=WG GW=WG GB=RR BBWBB=RBWBB R=U)
// export const model = parseRules("(RBB=WWR R*W=W*R)")
// export const model = parseRules("(RBB=GGR RGG=WWR)")
// export const model = parseRules("(RBB=**R)")
// export const model = parseRules("(W=R B=W)")
export const steps = writable(0)
export const stepPerformance = writable(0)
export const traversalsPerIntervalInput = writable(1)
export const successfulBuild = writable(true)
export const errorMessage = writable("")
export let traversalsPerIntervalSys = 1
traversalsPerIntervalInput.subscribe(v => traversalsPerIntervalSys = v ** 2)
// export let intervalInput = writable(50)
// export let interval = derived(intervalInput, (v) => v * 16)
// export let intervalSys = 16
export let interval = 16

export let playing = writable(false)
export let playingSys = true // TODO: How can we remove this system?

let renderer: WebGPURenderer;
// TODO: It's not 1 step, change this to a better name
export const step = () => {
    const t1 = performance.now()
    for (let i = 0; i < traversalsPerIntervalSys; i++) {
        for (const rule of model) {
            traverse(rule);
        }
    }
    renderer.updateTiles(board)
    const t2 = performance.now()

    steps.update((v) => v + traversalsPerIntervalSys)
    stepPerformance.update(() => t2 - t1)
}

export const init = (r: WebGPURenderer) => {
    renderer = r;
    r.updateColours(palette)

    console.log(model)

    restart()
    setInterval(() => {
        if (playingSys) {
            step()
        }
    }, interval)
}

// const isCellPaletteAlias = (cell: number, alias: ValidPattern) => alias === "*" ? true : cell === paletteAlias[alias]
const isCellPaletteAlias = (cell: number, alias: ValidPattern) => alias === "*" ? true : cell === paletteAlias[alias]
const getIndexOfBoardCoordinate = (x: number, y: number) => y * width + x
const getBoardCoordinateFromIndex = (index: number) => [index % width, Math.floor(index / height)]
const getIndexesFromLine = (x: number, y: number, direction: Direction, length: number) => {
    const indexes = new Uint16Array(length);
    const extraSpace = length - 1;

    switch (direction) {
        case 0: // Up (default)
            if (x + (extraSpace) >= width) return indexes;
            for (let i = 0; i < length; i++) indexes[i] = getIndexOfBoardCoordinate(x + i, y)
            break;
            // TODO: Rearrange these directions, they are wrong
            /*
        case 1: // Right
            if (x + (extraSpace) >= width || y - (extraSpace) <= 0) return indexes;
            for (let i = 0; i < length; i++) indexes[i] = getIndexOfBoardCoordinate(x + i, y)
            break;
        case 2: // Down
            if (x - (extraSpace) <= 0 || y + (extraSpace) >= height) return indexes;
            for (let i = 0; i < length; i++) indexes[i] = getIndexOfBoardCoordinate(x, y + i)
            break;
        case 3: // Left
            if (x + (extraSpace) >= width || y - (extraSpace) <= 0) return indexes;
            for (let i = 0; i < length; i++) indexes[i] = getIndexOfBoardCoordinate(x - i, y)
            break;

             */
    }

    // const outOfBounds = indexes.some(i => i < 0 || i >= board.length);
    // return outOfBounds ? undefined : indexes;
    return indexes;
}
const getIndexesFromSquare = (x: number, y: number, w: number, h: number, rotation: Direction) => {
    const indexes: Uint16Array[] = [];
    for (let i = 0; i < w; i++) {
        indexes.push(new Uint16Array(h))
    }

    const upWidth = (h - 1);
    const upHeight = (w - 1);
    switch (rotation) {
        // Replacing i < w with i < h made the game way faster?
        // indexes.push(board.slice(getIndexOfBoardCoordinate(x, y - i), getIndexOfBoardCoordinate(x + w, y - i)));
        case 0: // Up is default
            if (x + upWidth >= width || y - upHeight < 0) return [];

            for (let i = 0; i < h; i++) {
                // indexes.push([])
                for (let j = 0; j < w; j++) {
                    indexes[j][i] = getIndexOfBoardCoordinate(x + j, y - i)
                }
            }
            break;
            // TODO: AI code warning, this seems to work but could be wrong
            /*
        case 1: // Right
            if (true) return [];
            // if (x + h > width || y - w < 0) return [];

            for (let i = 0; i < h; i++) {
                // indexes      .push([]);
                for (let j = 0; j < w; j++) {
                    indexes[j][i] = getIndexOfBoardCoordinate(x + i, y + j)
                }
            }
            break;
        case 2: // Down
            if (x - upWidth < 0 || y + upHeight >= height) return [];
            // if (x + w > width || y - h < 0) return [];

            for (let i = 0; i < h; i++) {
                // indexes.push([]);
                for (let j = 0; j < w; j++) {
                    indexes[j][i] = getIndexOfBoardCoordinate(x - j, y + i)
                }
            }
            break;
        case 3: // Left
            if (true) return [];
            // if (x + h > width || y - w < 0) return [];

            for (let i = 0; i < h; i++) {
                // indexes.push([]);
                for (let j = 0; j < w; j++) {
                    indexes[j][i] = getIndexOfBoardCoordinate(x - i, y - j)
                }
            }
            break;

             */
    }

    // const outOfBounds = indexes
    //     .flat()
    //     .some(i => i < 0 || i >= board.length);
    // return outOfBounds ? undefined : indexes;
    return indexes;
}

const debug = (chance: number, ...text: unknown[]) => (Math.random() < chance) && console.log(...text)
const isSequenceEqualToArray = (sequence: ValidPattern[], indexes: Uint16Array) => {
    if (sequence.length !== indexes.length) return false;

    // Since "*" is a wildcard, we just return true
    // return sequence.every((value, i) => value === "*" ? true : paletteAlias[value] === board[indexes[i]]);
    // debug(1e-7, sequence, indexes)
    return sequence.every((value, i) => isCellPaletteAlias(board[indexes[i]], value))
}
const isGridEqualToArray = (grid: ValidPattern[][], indexes: Uint16Array[]) => {
    // debug(1e-7, "match_2", grid, indexes, grid.length, indexes.length)
    if (grid.length !== indexes.length) return false;
    if (grid[0].length !== indexes[0].length) return false;

    // debug(1, indexes)
    // Since "*" is a wildcard, we just return true
    // return grid.every((row, i) => row.every((value, j) => paletteAlias[value] === board[indexes[i][j]] || paletteAlias["*"] === board[indexes[i][j]]));
    // debug(1, "cell", isCellPaletteAlias(board[indexes[0][0]], "B"))
    return grid.every((row, i) => row.every((value, j) => isCellPaletteAlias(board[indexes[i][j]], value)));
}

const selectWithCell = (pattern: PatternCell): number[] => {
    const indexes = [];
    for (let i = 0; i < board.length; i++) {
        const cell = board[i];
        if (isCellPaletteAlias(cell, pattern.select)) {
            indexes.push(i);
        }
    }
    return indexes;
}

const selectWithSequence = (pattern: PatternSequence): Uint16Array[] => {
    const indexSequences: Uint16Array[] = [];
    const sequenceLength = pattern.select.length;
    for (let i = 0; i < board.length; i++) {
        const [x, y] = getBoardCoordinateFromIndex(i);

        // up
        const lineUp = getIndexesFromLine(x, y, Direction.Up, sequenceLength);
        // if (lineUp) {
            if (isSequenceEqualToArray(pattern.select, lineUp)) {
                indexSequences.push(lineUp);
            }
        // }

        /*
        // left
        const lineLeft = getIndexesFromLine(x, y, Direction.Left, sequenceLength);
        // if (lineLeft) {
            if (isSequenceEqualToArray(pattern.select, lineLeft)) {
                indexSequences.push(lineLeft);
            }
        // }

        // down
        const lineDown = getIndexesFromLine(x, y, Direction.Down, sequenceLength);
        // if (lineDown) {
            if (isSequenceEqualToArray(pattern.select, lineDown)) {
                indexSequences.push(lineDown);
            }
        // }

        // right
        const lineRight = getIndexesFromLine(x, y, Direction.Right, sequenceLength);
        // if (lineRight) {
            if (isSequenceEqualToArray(pattern.select, lineRight)) {
                indexSequences.push(lineRight);
            }
        // }

         */
    }

    return indexSequences;
}

const selectWihGrid = (pattern: PatternGrid): Uint16Array[][] => {
    const indexGrids: Uint16Array[][] = [];
    const gridWidth = pattern.select.length;
    const gridHeight = pattern.select[0].length;
    for (let i = 0; i < board.length; i++) {
        const [x, y] = getBoardCoordinateFromIndex(i);

        // up
        const lineUp = getIndexesFromSquare(x, y, gridWidth, gridHeight, Direction.Up);
        // debug(1e-6, lineUp)
        // if (lineUp) {
        //     debug(1e-6, "match", pattern.select, lineUp)
            if (isGridEqualToArray(pattern.select, lineUp)) {
                indexGrids.push(lineUp);
            }
        // }

        // left
        const lineLeft = getIndexesFromSquare(x, y, gridWidth, gridHeight, Direction.Left);
        // if (lineLeft) {
            if (isGridEqualToArray(pattern.select, lineLeft)) {
                indexGrids.push(lineLeft);
            }
        // }

        // down
        const lineDown = getIndexesFromSquare(x, y, gridWidth, gridHeight, Direction.Down);
        // if (lineDown) {
            if (isGridEqualToArray(pattern.select, lineDown)) {
                indexGrids.push(lineDown);
            }
        // }

        // right
        const lineRight = getIndexesFromSquare(x, y, gridWidth, gridHeight, Direction.Right);
        // if (lineRight) {
            if (isGridEqualToArray(pattern.select, lineRight)) {
                indexGrids.push(lineRight);
            }
        // }
    }

    return indexGrids
}

const setBoardIndex = (index: number, select: ValidPattern) => {
    const outOfBounds = index < 0 || index >= board.length;
    if (select !== "*" && !outOfBounds) {
        board[index] = paletteAlias[select]
    }
}

// Return true if a selection was found
export const traverse = (rule: Rule): boolean => {
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
                // For now im assuming all groups are parallel
                // for (const child of rule.children) {
                //     traverse(child)
                // }
                // throw "Markov not implemented";
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
                            // board[cellIndex] = paletteAlias[rule.result.select as ValidPattern]
                        }
                        break;
                    case "One":
                        if (selection.length > 0) {
                            const index = pick(selection);
                            setBoardIndex(index, rule.result.select as ValidPattern)
                            // board[index] = paletteAlias[rule.result.select as ValidPattern]
                        }
                        break;
                }
                break;
            case "Sequence":
                selection = selectWithSequence(rule.select)
                // console.log(selection)
                switch (rule.type) {
                    case "All":
                        for (const sequence of selection) {
                            for (let i = 0; i < sequence.length; i++) {
                                const index = sequence[i];
                                const result = rule.result.select[i];
                                setBoardIndex(index, result as ValidPattern)
                                // board[index] = paletteAlias[result as ValidPattern]
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
                                // board[index] = paletteAlias[result as ValidPattern]
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
                                    // board[index] = paletteAlias[result as ValidPattern]
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
                                    // board[index] = paletteAlias[result as ValidPattern]
                                }
                            }
                        }
                        break;
                }
                break;
        }

        return selection.length > 0;
        // switch (rule.type) {
        //     case "All":
        //         break;
        //     case "One":
        //         break;
        //
        // }
        // Gather all cells that match the select pattern
        // const cellIndexes = [];
        // for (let i = 0; i < board.length; i++) {
        //     if (board[i] === paletteAlias[rule.select]) {
        //         cellIndexes.push(i)
        //     }
        // }
        //
        // switch (rule.type) {
        //     case "All":
        //         for (const cellIndex of cellIndexes) {
        //             board[cellIndex] = paletteAlias[rule.result]
        //         }
        //         break;
        //     case "One":
        //         if (cellIndexes.length > 0) {
        //             const index = pick(cellIndexes);
        //             board[index] = paletteAlias[rule.result]
        //         }
        //         break;
        // }
    }

    // TODO: What's the appropriate return value for this?
    return true;
}

export const pause = () => {
    playing.update(v => !v)
    playingSys = !playingSys
}

export const restart = () => {
    steps.set(0)
    board.fill(0)
    // DEBUG
    // board[getIndexOfBoardCoordinate(width / 2, height / 2)] = paletteAlias["R"]
    renderer?.updateTiles(board)
}

// TODO: Put this in a "misc.ts" eventually
// Assuming arrays are ordered
const isEqualArrays = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

let pastTokens: string[] = [];
export const setModel = (newModel: string) => {
    try {
        const tokens = lexModel(newModel);

        // To avoid restarts, check if the new model gives the same tokens as the last one.
        if (isEqualArrays(pastTokens, tokens)) return;
        model = parseRulesFromTokens(tokens);
        restart()

        // On Success
        console.log("New Model:", model)
        pastTokens = tokens;
        localStorage.setItem("model", newModel)
        successfulBuild.set(true)
    } catch (e) {
        console.error(e)
        errorMessage.set(e as string)
        successfulBuild.set(false)
    }
}

// TODO: Figure out why TF /wiki needs localStorage??
export let rules = writable("")
rules.subscribe(v => setModel(v))