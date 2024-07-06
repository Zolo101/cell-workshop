import { type Pattern, type Rule, type ValidPattern } from "$lib/index";
import { paletteAlias } from "$lib/constants";

const isValidPatternString = (pattern: string) => {
    for (const char of pattern) {
        if (!(char in paletteAlias || char === "*" || char === "/")) {
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
            select: pattern as ValidPattern
        }
    }

    const probablyGridPattern = pattern.includes("/");
    if (probablyGridPattern) {
        const grid = pattern.split("/").map(row => row.split(""));
        return {
            type: "Grid",
            select: grid as ValidPattern[][]
        }
    } else {
        return {
            type: "Sequence",
            select: pattern.split("") as ValidPattern[]
        }
    }
}

// const buildPattern = (pattern: ValidPattern[]): Pattern => {
//     if (pattern.length === 0) {
//         // TODO: I don't think this is the correct way
//         return {
//             type: "Cell",
//             select: "*"
//         }
//     } else if (pattern.length === 1) {
//         return {
//             type: "Cell",
//             select: pattern[0]
//         }
//     } else {
//         return {
//             type: "Sequence",
//             select: pattern
//         }
//     }
// }

const buildGridPattern = (grid: ValidPattern[][]): Pattern => {
    return {
        type: "Grid",
        select: grid
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
                case "=":
                case ">":
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
    type: "Sequence" | "Markov",
    parent: true
    parts: RuleBuilderNode[],
    startIndex: number
    endIndex: number
}

type RuleBuilderLeaf = {
    type: "All" | "One",
    parent: false
    tokens: string[]
    startIndex: number
    endIndex: number
}

type RuleBuilderNode = RuleBuilderTree | RuleBuilderLeaf

const buildTokens = (type: "Sequence" | "Markov", tokens: string[], startIndex: number): RuleBuilderNode => {
    const build: RuleBuilderNode = {
        type,
        parent: true,
        parts: [],
        startIndex,
        endIndex: startIndex
    }
    for (let i = startIndex; i < tokens.length; i++) {
        const token = tokens[i];
        switch (token) {
            case "[":
            case "(":
                build.parts.push(buildTokens(token === "[" ? "Sequence" : "Markov", tokens, i + 1));
                i = build.parts.at(-1)!.endIndex;
                break;
            case "]":
            case ")":
                build.endIndex = i;
                return build;
            case "=":
            case ">":
                build.parts.push({
                    type: token === "=" ? "One" : "All",
                    parent: false,
                    tokens: [tokens[i - 1], tokens[i + 1]],
                    startIndex: i - 1,
                    endIndex: i + 1
                })
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

    // console.log(JSON.stringify(builds, null, 2))
    // console.log(builds)
    // console.log(rules)
    return rules
}

export const parseRulesFromTokens = (tokens: string[]): Rule[] => {
    const builds = buildTokens("Sequence", tokens, 0) as RuleBuilderTree;
    const rules = createRules(builds)
    return rules
}

// export const parseRules = (model: string): Rule[] => {
//     // console.log("Parsing model", model)
//     let rule: Rule[] = [];
//     let workingRules: Rule[] = [];
//     let workingType: "One" | "All" = "One";
//     let workingPatternStrings: Record<string, ValidPattern[]>[] = []
//     let workingGridStrings: Record<string, ValidPattern[][]>[] = []
//     let depth = -1;
//
//     let currentWorkingPattern = "L"
//
//     const addGroupRule = (type: "Sequence" | "Markov") => {
//         currentWorkingPattern = "L"
//         workingRules.push({
//             type,
//             group: true,
//             children: []
//         })
//         workingPatternStrings.push({
//             L: [],
//             R: []
//         })
//         workingGridStrings.push({
//             L: [],
//             R: []
//         })
//         depth++;
//     }
//
//     for (const char of model) {
//         console.log(char, JSON.stringify(workingPatternStrings))
//         switch (char) {
//             case "[":
//                 // TODO: Make "Stack" class?
//                 addGroupRule("Sequence")
//                 break;
//             case "(":
//                 // currentWorkingPattern = "L"
//                 addGroupRule("Markov")
//                 break;
//             case "]":
//             case ")":
//                 const workingRule_Bracket = workingRules.pop();
//
//                 if (workingRule_Bracket && workingRule_Bracket.group) {
//                     // TODO: Remove duplicate code
//                     // Check if we have a grid pattern
//                     // const workingGridString = workingGridStrings[depth];
//                     // const workingPatternString = workingPatternStrings[depth];
//                     if (workingGridStrings[depth].L.length > 0) {
//                         // We got a grid pattern!
//
//                         if (workingGridStrings[depth].L.length === workingGridStrings[depth].R.length) {
//                             workingGridStrings[depth].L.push(workingPatternStrings[depth].L)
//                             workingGridStrings[depth].R.push(workingPatternStrings[depth].R)
//
//                             workingRule_Bracket.children.push({
//                                 type: workingType,
//                                 group: false,
//                                 select: buildGridPattern(workingGridStrings[depth].L),
//                                 result: buildGridPattern(workingGridStrings[depth].R)
//                             })
//                         } else {
//                             throw "Left and Right patterns must be the same width & height"
//                         }
//                     } else {
//                         // Then we have a normal pattern
//                         if (workingPatternStrings[depth].R.length > 0) {
//                             workingRule_Bracket.children.push({
//                                 type: workingType,
//                                 group: false,
//                                 select: buildPattern(workingPatternStrings[depth].L),
//                                 result: buildPattern(workingPatternStrings[depth].R)
//                             })
//                         } else {
//                             throw "Right Pattern not found"
//                         }
//                     }
//
//                     console.log(workingPatternStrings[depth].L, workingPatternStrings[depth].R)
//                     if (workingPatternStrings[depth].L.length !== workingPatternStrings[depth].R.length) {
//                         throw "Left and Right patterns must be the same length"
//                     }
//
//                     rule.push(workingRule_Bracket)
//                     // workingRules = null;
//                     // workingPattern.L = null;
//                     // workingPattern.R = null;
//                     workingType = "One";
//                     workingPatternStrings[depth].L = [];
//                     workingPatternStrings[depth].R = [];
//                     workingGridStrings[depth].L = [];
//                     workingGridStrings[depth].R = [];
//                     currentWorkingPattern = "L";
//                 } else {
//                     throw "Unmatched )"
//                 }
//                 depth--;
//                 break;
//             case "=":
//                 if (workingPatternStrings[depth].L) {
//                     currentWorkingPattern = "R";
//                     workingType = "One";
//                 } else {
//                     throw "Left Pattern not found"
//                 }
//                 break;
//             case ">":
//                 if (workingPatternStrings[depth].L) {
//                     currentWorkingPattern = "R";
//                     workingType = "All";
//                 } else {
//                     throw "Left Pattern not found"
//                 }
//                 break;
//             case "/":
//                 workingGridStrings[depth][currentWorkingPattern].push(workingPatternStrings[depth][currentWorkingPattern])
//                 workingPatternStrings[depth][currentWorkingPattern] = []
//                 break;
//             case " ":
//                 const workingRule_Space = workingRules[depth];
//                 if (workingRule_Space && workingRule_Space.group) {
//                     // Check if we have a grid pattern
//                     // const workingGridString = workingGridStrings[depth];
//                     // const workingPatternString = workingPatternStrings[depth];
//                     if (workingGridStrings[depth].L.length > 0) {
//                         // We got a grid pattern!
//                         workingGridStrings[depth].L.push(workingPatternStrings[depth].L)
//                         workingGridStrings[depth].R.push(workingPatternStrings[depth].R)
//
//                         if (workingGridStrings[depth].L.length === workingGridStrings[depth].R.length) {
//                             workingRule_Space.children.push({
//                                 type: workingType,
//                                 group: false,
//                                 select: buildGridPattern(workingGridStrings[depth].L),
//                                 result: buildGridPattern(workingGridStrings[depth].R)
//                             })
//                         } else {
//                             throw "Left and Right patterns must be the same width & height"
//                         }
//                     } else {
//                         if (workingPatternStrings[depth].R.length > 0) {
//                             workingRule_Space.children.push({
//                                 type: workingType,
//                                 group: false,
//                                 select: buildPattern(workingPatternStrings[depth].L),
//                                 result: buildPattern(workingPatternStrings[depth].R)
//                             })
//                         } else {
//                             throw "Right Pattern not found"
//                         }
//                     }
//                     // workingPattern.L = null;
//                     // workingPattern.R = null;
//                     workingType = "One";
//                     // workingPatternStrings[depth].L = [];
//                     // workingPatternStrings[depth].R = [];
//                     // workingGridStrings[depth].L = [];
//                     // workingGridStrings[depth].R = [];
//                     currentWorkingPattern = "L";
//                 } else {
//                     // throw "Unmatched )"
//                 }
//                 break;
//             default:
//                 if (char in paletteAlias) {
//                     console.log(char, workingPatternStrings, depth, currentWorkingPattern, workingPatternStrings.length)
//                     workingPatternStrings[depth][currentWorkingPattern].push(char as ValidPattern);
//                 } else {
//                     throw "Invalid character: " + char
//                 }
//                 break;
//         }
//     }
//
//     return rule;
// }