import { type PatternNode, type Renderer } from "$lib/index.svelte";
import { type ValidCode } from "$lib/constants";

type PatternCell = PatternNode & {type: "Cell", select: ValidCode}
type PatternSequence = PatternNode & {type: "Sequence", select: ValidCode[]}
type PatternGrid = PatternNode & {type: "Grid", select: ValidCode[][]}

enum Direction {
    Up,
    Left,
    Down,
    Right
}

const directionOffsets = [
    [1, 0],  // Up
    [0, 1],  // Right
    [-1, 0], // Down
    [0, -1]  // Left
];

const rotationOffsets = [
    [[1, 0], [0, 1]],   // Up
    [[0, -1], [1, 0]],  // Right
    [[-1, 0], [0, -1]], // Down
    [[0, 1], [-1, 0]]   // Left
];

// TODO: Next step in optimizing would be to do this in WASM
// Check out https://www.assemblyscript.org/
// Or try out https://rustwasm.github.io/docs/book/ it might be faster
// Start by implementing the selector, then the parser.
// Also, figure out how to talk to the webgl/webgpu2 renderer from WASM? Is this needed? It would remove the cpu overhead...
export default class RendererSelector {
    renderer: Renderer;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    isCellPaletteAlias(cell: number, alias: ValidCode) {
        // return cell >= 0 && cell <= 16;
        return cell === alias || alias === 16
    }

    getIndexesFromLine(start: number, direction: Direction, length: number) {
        const indexes = new Array(length);
        const [dx, dy] = directionOffsets[direction];

        // TODO: There is a 1 pixel gap to the right and bottom...
        // if (x + length > this.renderer.width + 0 || y + length > this.renderer.height + 0) return indexes;

        // for (let i = 0; i < length; i++) indexes[i] = this.getIndexOfBoardCoordinate(x + (i * dx), y + (i * dy));
        for (let i = 0; i < length; i++) indexes[i] = start + (i * dx) + (this.renderer.width * (i * dy));

        // const outOfBounds = indexes.some(i => i < 0 || i >= this.renderer.board.length);
        // return outOfBounds ? undefined : indexes;
        return indexes;
    }

    getIndexesFromSquare(start: number, w: number, h: number, rotation: Direction) {
        const indexes = new Array(w * h);
        const [[dx1, dy1], [dx2, dy2]] = rotationOffsets[rotation];

        let index = 0;
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                // indexes[index] = this.getIndexOfBoardCoordinate(x + (i * dx1) + (j * dx2), y + (i * dy1) + (j * dy2));
                indexes[index] = start + (i * dx1) + (j * dx2) + (this.renderer.width * ((i * dy1) + (j * dy2)));
                // indexes[index] = start + (i * rotationOffsets[rotation][0][0]) + (j * rotationOffsets[rotation][1][0]) + (this.renderer.width * ((i * rotationOffsets[rotation][0][1]) + (j * rotationOffsets[rotation][1][1])));
                // indexes[index] = start + j + (this.renderer.width * i);
                index++;
            }
        }
        return indexes;
    }

    isSequenceEqualToArray(sequence: ValidCode[], indexes: number[]) {
        if (sequence.length !== indexes.length) return false;

        // Since "*" is a wildcard, we just return true
        // return sequence.every((value, i) => value === "*" ? true : paletteAlias[value] === board[indexes[i]]);
        // debug(1e-7, sequence, indexes)

        for (let i = 0; i < sequence.length; i++) {
            if (!this.isCellPaletteAlias(this.renderer.board[indexes[i]], sequence[i])) {
                return false;
            }
        }
        return true;


        // return sequence.every((value, i) => this.isCellPaletteAlias(this.renderer.board[indexes[i]], value))
    }

    isGridEqualToArray(grid: ValidCode[][], indexes: number[]) {
        // debug(1e-7, "match_2", grid, indexes, grid.length, indexes.length)
        if (grid.length * grid[0].length !== indexes.length) return false;

        // debug(1, indexes)
        // Since "*" is a wildcard, we just return true
        // return grid.every((row, i) => row.every((value, j) => paletteAlias[value] === board[indexes[i][j]] || paletteAlias["*"] === board[indexes[i][j]]));
        // debug(1, "cell", isCellPaletteAlias(board[indexes[0][0]], "B"))

        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (!this.isCellPaletteAlias(this.renderer.board[indexes[i * grid.length + j]], grid[i][j])) {
                    return false;
                }
            }
        }

        return true;

        // return grid
        //     .every((row, i) => row
        //         .every((value, j) => this.isCellPaletteAlias(this.renderer.board[indexes[i * grid.length + j]], value)));
    }

    selectWithCell(pattern: PatternCell): number[] {
        const indexes = [];

        for (let i = 0; i < this.renderer.board.length; i++) {
            const cell = this.renderer.board[i];
            if (this.isCellPaletteAlias(cell, pattern.select)) {
                indexes.push(i);
            }
        }

        return indexes;
    }

    selectWithSequence(pattern: PatternSequence, omnidirectional: boolean): number[][] {
        const indexSequences: number[][] = [];
        const sequenceLength = pattern.select.length;
        for (let i = 0; i < this.renderer.board.length; i++) {
            // const [x, y] = this.getBoardCoordinateFromIndex(i);
            if (!this.isCellPaletteAlias(this.renderer.board[i], pattern.select[0])) continue;

            const lineUp = this.getIndexesFromLine(i, Direction.Up, sequenceLength);
            if (this.isSequenceEqualToArray(pattern.select, lineUp)) indexSequences.push(lineUp);

            if (omnidirectional) {
                const lineLeft = this.getIndexesFromLine(i, Direction.Left, sequenceLength);
                const lineDown = this.getIndexesFromLine(i, Direction.Down, sequenceLength);
                const lineRight = this.getIndexesFromLine(i, Direction.Right, sequenceLength);

                if (this.isSequenceEqualToArray(pattern.select, lineLeft)) indexSequences.push(lineLeft);
                if (this.isSequenceEqualToArray(pattern.select, lineDown)) indexSequences.push(lineDown);
                if (this.isSequenceEqualToArray(pattern.select, lineRight)) indexSequences.push(lineRight);
            }
        }

        return indexSequences;
    }

    selectWithGrid(pattern: PatternGrid, omnidirectional: boolean): number[][] {
        const indexGrids: number[][] = [];
        const gridWidth = pattern.select.length;
        const gridHeight = pattern.select[0].length;
        for (let i = 0; i < this.renderer.board.length; i++) {
            // const [x, y] = this.getBoardCoordinateFromIndex(i);
            if (!this.isCellPaletteAlias(this.renderer.board[i], pattern.select[0][0])) continue;

            const lineUp = this.getIndexesFromSquare(i, gridWidth, gridHeight, Direction.Up);
            if (this.isGridEqualToArray(pattern.select, lineUp)) indexGrids.push(lineUp);

            if (omnidirectional) {
                const lineLeft = this.getIndexesFromSquare(i, gridWidth, gridHeight, Direction.Left);
                const lineDown = this.getIndexesFromSquare(i, gridWidth, gridHeight, Direction.Down);
                const lineRight = this.getIndexesFromSquare(i, gridWidth, gridHeight, Direction.Right);

                if (this.isGridEqualToArray(pattern.select, lineLeft)) indexGrids.push(lineLeft);
                if (this.isGridEqualToArray(pattern.select, lineDown)) indexGrids.push(lineDown);
                if (this.isGridEqualToArray(pattern.select, lineRight)) indexGrids.push(lineRight);
            }
        }

        return indexGrids
    }
}

