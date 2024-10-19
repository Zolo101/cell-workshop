import type WebGPURenderer from "$lib/render/webgpu";
import type WebGL2Renderer from "$lib/render/webgl2";
import type { ValidCode, ValidPattern } from "$lib/constants";

type Node = {
    type: string
    group: boolean
}

export type PatternNode = {
    type: string
}

type PatternCell = PatternNode & {type: "Cell", select: ValidCode}
type PatternSequence = PatternNode & {type: "Sequence", select: ValidCode[]}
type PatternGrid = PatternNode & {type: "Grid", select: ValidCode[][]}

export type Pattern = PatternCell | PatternSequence | PatternGrid

type Singlet = Node & {
    group: false,
    omnidirectional: boolean
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
 * @description Will attempt to run each rule in order regardless if it succeeds or not.
 * @since 0.1.0
 * @example [B=W B=R]
 * @group Group
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

export type ModelOK = {
    ok: true
    rules: Rule[]
}

type ModelError = {
    ok: false
    // TODO: Give ModelError a type (see setModel function catch)
    failReason: any
}

export type ModelResult = ModelOK | ModelError

export type Renderer = WebGPURenderer | WebGL2Renderer
export type RGBA = [number, number, number, number]