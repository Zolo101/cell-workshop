import { type PatternNode, type Renderer, type ValidPattern } from "$lib/index.svelte";
import { paletteAlias } from "$lib/constants";

type PatternCell = PatternNode & {type: "Cell", select: ValidPattern}
type PatternSequence = PatternNode & {type: "Sequence", select: ValidPattern[]}
type PatternGrid = PatternNode & {type: "Grid", select: ValidPattern[][]}

enum Direction {
    Up,
    Left,
    Down,
    Right
}

function buildLPS(pattern: number[][], N: number, M: number): number[] {
    const lps: number[] = new Array(N * M).fill(0);
    let length = 0;
    let i = 1;

    while (i < N * M) {
        const row = Math.floor(i / M);
        const col = i % M;

        const prow = Math.floor(length / M);
        const pcol = length % M;

        if (pattern[row][col] === pattern[prow][pcol]) {
            length++;
            lps[i] = length;
            i++;
        } else {
            if (length !== 0) {
                length = lps[length - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }

    return lps;
}

function kmp2D(grid: number[][], pattern: number[][], R: number, C: number): [number, number][] {
    const N = pattern.length;
    const M = pattern[0].length;
    const lps = buildLPS(pattern, N, M);
    const result: [number, number][] = [];

    let i = 0, j = 0;

    while (i <= R - N) {
        while (j <= C - M) {
            let k = 0;
            while (k < N * M) {
                const gridRow = i + Math.floor(k / M);
                const gridCol = j + (k % M);
                const patRow = Math.floor(k / M);
                const patCol = k % M;

                if (grid[gridRow][gridCol] !== pattern[patRow][patCol]) {
                    if (k !== 0) {
                        k = lps[k - 1];
                    } else {
                        j++;
                        break;
                    }
                } else {
                    k++;
                }
            }

            if (k === N * M) {
                result.push([i, j]);
                j++;
            }
        }
        i++;
        j = 0; // Reset column index for the next row
    }

    return result;
}

// Example Usage
const grid: number[][] = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 1, 2, 3],
    [4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13]
];

const pattern: number[][] = [
    [1, 2, 3],
    [6, 7, 8]
];

const matches = kmp2D(grid, pattern, grid.length, grid[0].length);
console.log(matches); // Output: [[0, 0], [2, 2]]

export default class RendererSelector {
    renderer: Renderer;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    // const isCellPaletteAlias = (cell: number, alias: ValidPattern) => alias === "*" ? true : cell === paletteAlias[alias]
    isCellPaletteAlias(cell: number, alias: ValidPattern) {
        return alias === "*" ? true : cell === paletteAlias[alias]
    }

    getIndexOfBoardCoordinate(x: number, y: number) {
        return y * this.renderer.width + x
    }

    getBoardCoordinateFromIndex(index: number) {
        return [index % this.renderer.width, Math.floor(index / this.renderer.height)]
    }
    getIndexesFromLine(x: number, y: number, direction: Direction, length: number) {
        const indexes = new Uint32Array(length);

        switch (direction) {
            case 0: // Up (default)
                if (x + length > this.renderer.width) return indexes;
                for (let i = 0; i < length; i++) indexes[i] = this.getIndexOfBoardCoordinate(x + i, y)
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

    getIndexesFromSquare(x: number, y: number, w: number, h: number, rotation: Direction) {
        const indexes: Uint32Array[] = [];
        for (let i = 0; i < w; i++) {
            indexes.push(new Uint32Array(h))
        }

        const upWidth = (w - 0);
        const upHeight = (h - 0);
        // const upWidth = (h - 20);
        // const upHeight = (w - 20);
        switch (rotation) {
            // Replacing i < w with i < h made the game way faster?
            // indexes.push(board.slice(getIndexOfBoardCoordinate(x, y - i), getIndexOfBoardCoordinate(x + w, y - i)));
            case 0: // Up is default
                // console.log(x + upWidth >= width, x, y, upWidth, upHeight, w, h)
                // if (x + w > width + 0 || y + h < 0) return [];
                if (x > this.renderer.width + 0 || y + h < 0) return [];

                for (let i = 0; i < h; i++) {
                    // indexes.push([])
                    for (let j = 0; j < w; j++) {
                        indexes[j][i] = this.getIndexOfBoardCoordinate(x + i, y + j)
                    }
                }
                break;
            // TODO: AI code warning, this seems to work but could be wrong
            /*
        case 1: // Right
            if (true) return [];
            // if (x + h > width || y - w < 0) return [];

            for (let i = 0; i < h; i++) {
                // indexes.push([]);
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

    isSequenceEqualToArray(sequence: ValidPattern[], indexes: Uint32Array) {
        if (sequence.length !== indexes.length) return false;

        // Since "*" is a wildcard, we just return true
        // return sequence.every((value, i) => value === "*" ? true : paletteAlias[value] === board[indexes[i]]);
        // debug(1e-7, sequence, indexes)
        return sequence.every((value, i) => this.isCellPaletteAlias(this.renderer.board[indexes[i]], value))
    }

    isGridEqualToArray(grid: ValidPattern[][], indexes: Uint32Array[]) {
        // debug(1e-7, "match_2", grid, indexes, grid.length, indexes.length)
        if (grid.length !== indexes.length) return false;
        if (grid[0].length !== indexes[0].length) return false;

        // debug(1, indexes)
        // Since "*" is a wildcard, we just return true
        // return grid.every((row, i) => row.every((value, j) => paletteAlias[value] === board[indexes[i][j]] || paletteAlias["*"] === board[indexes[i][j]]));
        // debug(1, "cell", isCellPaletteAlias(board[indexes[0][0]], "B"))
        return grid.every((row, i) => row.every((value, j) => this.isCellPaletteAlias(this.renderer.board[indexes[i][j]], value)));
    }

    selectWithCell(pattern: PatternCell): number[] {
        const indexes = [];
        for (let i = 0; i < this.renderer.board.length; i++) {
            const cell = this.renderer.board[i];
            if (this.isCellPaletteAlias(cell, pattern.select)) {
                indexes.push(i);
            }
        }
        // console.log(pattern, board)
        return indexes;
    }

    selectWithSequence(pattern: PatternSequence): Uint32Array[] {
        const indexSequences: Uint32Array[] = [];
        const sequenceLength = pattern.select.length;
        for (let i = 0; i < this.renderer.board.length; i++) {
            const [x, y] = this.getBoardCoordinateFromIndex(i);

            // up
            const lineUp = this.getIndexesFromLine(x, y, Direction.Up, sequenceLength);
            // if (lineUp) {
            if (this.isSequenceEqualToArray(pattern.select, lineUp)) {
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

    selectWihGrid(pattern: PatternGrid): Uint32Array[][] {
        const indexGrids: Uint32Array[][] = [];
        const gridWidth = pattern.select.length;
        const gridHeight = pattern.select[0].length;
        for (let i = 0; i < this.renderer.board.length; i++) {
            const [x, y] = this.getBoardCoordinateFromIndex(i);

            // up
            const lineUp = this.getIndexesFromSquare(x, y, gridWidth, gridHeight, Direction.Up);
            // debug(1e-6, lineUp)
            // if (lineUp) {
            //     debug(1e-6, "match", pattern.select, lineUp)
            if (this.isGridEqualToArray(pattern.select, lineUp)) {
                indexGrids.push(lineUp);
            }
            // }

            /*
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

             */
        }

        return indexGrids
    }
}

