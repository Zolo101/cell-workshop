import type { RGBA } from "$lib/render/webgpu";

export const version = "0.1.0"
export const palette: RGBA[] = [
    [0, 0, 0, 255], [29, 43, 83, 255], [126, 37, 83, 255], [0, 135, 81, 255],
    [171, 82, 54, 255], [95, 87, 79, 255], [194, 195, 199, 255], [255, 241, 232, 255],
    [255, 0, 77, 255], [255, 163, 0, 255], [255, 236, 39, 255], [0, 228, 54, 255],
    [41, 173, 255, 255], [131, 118, 156, 255], [255, 119, 168, 255], [255, 204, 170, 255], [0, 0, 0, 0]
]

export type ValidPattern = "B" | "I" | "P" | "E" | "N" | "D" | "A" | "W" | "R" | "O" | "Y" | "G" | "U" | "S" | "K" | "F" | "*"
export type ValidCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

export const paletteAlias = new Map<ValidPattern, ValidCode>([
    ["B", 0],
    ["I", 1],
    ["P", 2],
    ["E", 3],
    ["N", 4],
    ["D", 5],
    ["A", 6],
    ["W", 7],
    ["R", 8],
    ["O", 9],
    ["Y", 10],
    ["G", 11],
    ["U", 12],
    ["S", 13],
    ["K", 14],
    ["F", 15],
    ["*", 16]
])

// TODO: Get rid of this soon
export const reversePaletteAlias = new Map<ValidCode, ValidPattern>([
    [0, "B"],
    [1, "I"],
    [2, "P"],
    [3, "E"],
    [4, "N"],
    [5, "D"],
    [6, "A"],
    [7, "W"],
    [8, "R"],
    [9, "O"],
    [10, "Y"],
    [11, "G"],
    [12, "U"],
    [13, "S"],
    [14, "K"],
    [15, "F"],
    [16, "*"]
])