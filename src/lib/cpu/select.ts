import { board, height, type PatternNode, type ValidPattern, width } from "$lib/index.svelte";
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

export const selectWithCell = (pattern: PatternCell): number[] => {
    const indexes = [];
    for (let i = 0; i < board.length; i++) {
        const cell = board[i];
        if (isCellPaletteAlias(cell, pattern.select)) {
            indexes.push(i);
        }
    }
    return indexes;
}
export const selectWithSequence = (pattern: PatternSequence): Uint16Array[] => {
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
export const selectWihGrid = (pattern: PatternGrid): Uint16Array[][] => {
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