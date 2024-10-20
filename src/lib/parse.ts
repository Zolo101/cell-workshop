import { type Pattern, type Rule } from "$lib/index.svelte";
import { paletteAlias, type ValidPattern } from "$lib/constants";

const isValidPatternString = (pattern: string) => {
    for (const char of pattern) {
        if (!(paletteAlias.has(char as ValidPattern) || char === "*" || char === "/" || char === "~")) {
            return false;
        }
    }

    return true;
}

const buildPattern = (pattern: string): Pattern => {
    if (!isValidPatternString(pattern)) {
        throw "Invalid pattern string"
    }

    if (pattern.length === 0) {
        throw "Pattern is empty"
    }

    if (pattern.length === 1) {
        return {
            type: "Cell",
            select: paletteAlias.get(pattern as ValidPattern)!
        }
    }

    const probablyGridPattern = pattern.includes("/");
    if (probablyGridPattern) {
        const grid = pattern
            .split("/")
            .map(row => row
                .split("")
                .map((cell) => paletteAlias.get(cell as ValidPattern)!)
            );
        return {
            type: "Grid",
            select: grid
        }
    } else {
        const sequence = pattern
            .split("")
            .map((cell) => paletteAlias.get(cell as ValidPattern)!)
        return {
            type: "Sequence",
            select: sequence
        }
    }
}


export const lexModel = (model: string): string[] => {
    const fragments = model.split(" ");
    const tokens = [];
    let builder = ""
    for (const part of fragments) {
        if (builder.length > 0) {
            tokens.push(builder)
            builder = ""
        }

        for (const char of part) {
            switch (char) {
                case "(":
                case "[":
                case "]":
                case ")":
                case "~": // Omnidirectional
                case "=": // One
                case ">": // All
                // case "/":
                    if (builder.length > 0) {
                        tokens.push(builder, char)
                        builder = ""
                    } else {
                        tokens.push(char)
                    }
                    break;

                case "\n":
                    break;
                default:
                    builder += char
                    break;
            }
        }
    }

    return tokens;
}

type RuleBuilderTree = {
    type: "Sequence" | "Search",
    parent: true
    parts: RuleBuilderNode[],
    startIndex: number
    endIndex: number
}

type RuleBuilderLeaf = {
    type: "All" | "One",
    parent: false
    omnidirectional: boolean
    tokens: string[]
    startIndex: number
    endIndex: number
}

type RuleBuilderNode = RuleBuilderTree | RuleBuilderLeaf

const buildTokens = (type: "Sequence" | "Search", tokens: string[], startIndex: number): RuleBuilderNode => {
    const build: RuleBuilderNode = {
        type,
        parent: true,
        parts: [],
        startIndex,
        endIndex: startIndex
    }
    let omnidirectional = false;
    for (let i = startIndex; i < tokens.length; i++) {
        const token = tokens[i];

        switch (token) {
            case "[":
            case "(":
                build.parts.push(buildTokens(token === "[" ? "Sequence" : "Search", tokens, i + 1));
                i = build.parts.at(-1)!.endIndex;
                break;
            case "]":
            case ")":
                build.endIndex = i;
                return build;
            case "~":
                omnidirectional = true;
                break;
            case "=":
            case ">":
                build.parts.push({
                    type: token === "=" ? "One" : "All",
                    omnidirectional,
                    parent: false,
                    tokens: omnidirectional ? [tokens[i - 2], tokens[i + 1]] : [tokens[i - 1], tokens[i + 1]],
                    startIndex: i - 1,
                    endIndex: i + 1
                })
                omnidirectional = false;
                break;
            default:
                break;
        }
    }

    return build
}

const createRules = (builds: RuleBuilderTree): Rule[] => {
    const rules: Rule[] = []
    for (const part of builds.parts) {
        if (part.parent) {
            rules.push({
                type: part.type,
                group: true,
                children: createRules(part)
            })
        } else {
            rules.push({
                type: part.type,
                omnidirectional: part.omnidirectional,
                group: false,
                select: buildPattern(part.tokens[0]),
                result: buildPattern(part.tokens[1])
            })
        }
    }

    return rules;
}

export const parseRules = (model: string): Rule[] => {
    const tokens = lexModel(model);
    const builds = buildTokens("Sequence", tokens, 0) as RuleBuilderTree;
    const rules = createRules(builds)

    // console.log("Tokens:", tokens)
    // console.log("Builds:", JSON.stringify(builds, null, 2))
    // console.log(builds)
    // console.log("Rules:", JSON.stringify(rules, null, 2))
    return rules
}

export const parseRulesFromTokens = (tokens: string[]): Rule[] => {
    const builds = buildTokens("Sequence", tokens, 0) as RuleBuilderTree;
    const rules = createRules(builds)
    return rules
}