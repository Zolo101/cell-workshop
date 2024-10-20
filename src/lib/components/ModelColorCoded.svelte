<script lang="ts">
    import type { RGBA } from "$lib/render/webgpu";
    import { palette } from "$lib/constants";

    let { code = $bindable() }: {code: string} = $props();

    const paletteToRGBA = (palette: RGBA) => `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, 0.25)`;
    let settings = {
        highlightColors: false,
        AIAutoComplete: false
    }

    const styles: Record<string, Partial<CSSStyleDeclaration>> = {
        "search": {color: "#ffffff", fontWeight: "bold", position: "relative", top: "-1px"},
        "sequence": {color: "#ff7b00", fontWeight: "bold", position: "relative", top: "-1px"},
        "one": {color: "#b3b3b3"},//, fontWeight: "bold"},
        "all": {color: "cyan"},//, fontWeight: "bold"},
        "omnidirectional": {color: "#92baff"},
        "B": {backgroundColor: paletteToRGBA(palette[0])},
        "I": {backgroundColor: paletteToRGBA(palette[1])},
        "P": {backgroundColor: paletteToRGBA(palette[2])},
        "E": {backgroundColor: paletteToRGBA(palette[3])},
        "N": {backgroundColor: paletteToRGBA(palette[4])},
        "D": {backgroundColor: paletteToRGBA(palette[5])},
        "A": {backgroundColor: paletteToRGBA(palette[6])},
        "W": {backgroundColor: paletteToRGBA(palette[7])},
        "R": {backgroundColor: paletteToRGBA(palette[8])},
        "O": {backgroundColor: paletteToRGBA(palette[9])},
        "Y": {backgroundColor: paletteToRGBA(palette[10])},
        "G": {backgroundColor: paletteToRGBA(palette[11])},
        "U": {backgroundColor: paletteToRGBA(palette[12])},
        "S": {backgroundColor: paletteToRGBA(palette[13])},
        "K": {backgroundColor: paletteToRGBA(palette[14])},
        "F": {backgroundColor: paletteToRGBA(palette[15])},
        "*": {backgroundColor: paletteToRGBA(palette[16])},
        "default": {},
    }

    type Token = {
        type: keyof typeof styles,
        value: string
        break: boolean
    }

    // TODO: I don't like regex, how performant is this?
    const camelToKebab = (str: string) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

    const parseCSSStyleDeclaration = (declaration: Partial<CSSStyleDeclaration>) => {
        let str = "";
        for (const [key, value] of Object.entries(declaration)) {
            str += `${camelToKebab(key)}: ${value};`
        }

        return str;
    }

    const lexCode = (code: string): string[] => {
        const fragments = code.split("");
        const parts = [];
        let builder = ""
        for (const part of fragments) {
            if (builder.length > 0) {
                parts.push(builder)
                builder = ""
            }

            for (const char of part) {
                switch (char) {
                    case "[":
                    case "]":
                    case "(":
                    case ")":
                    case ">":
                    case "=":
                    case "B":
                    case "I":
                    case "P":
                    case "E":
                    case "N":
                    case "D":
                    case "A":
                    case "W":
                    case "R":
                    case "O":
                    case "Y":
                    case "G":
                    case "U":
                    case "S":
                    case "K":
                    case "F":
                    case "*":
                    case "\n":
                        // case "/":
                        if (builder.length > 0) {
                            parts.push(builder, char)
                            builder = ""
                        } else {
                            parts.push(char)
                        }
                        break;

                    default:
                        builder += char
                        break;
                }
            }
        }
        if (builder.length > 0) {
            parts.push(builder)
        }

        return parts;
    }

    const createToken = (type: keyof typeof styles, value: string, breakLine = false) => {return {type, value, break: breakLine}}

    const tokenizeParts = (parts: string[]): Token[] => {
        const tokens: Token[] = []
        for (const part of parts) {
            switch (part) {
                case "[":
                case "]":
                    tokens.push(createToken("sequence", part))
                    break;
                case "(":
                case ")":
                    tokens.push(createToken("search", part))
                    break;
                case ">":
                    tokens.push(createToken("all", part))
                    break;
                case "~":
                    tokens.push(createToken("omnidirectional", part))
                    break;
                case "/":
                case "=":
                    tokens.push(createToken("one", part))
                    break;
                case "\n":
                    tokens.push(createToken("default", part, true))
                    break;

                default:
                    if (settings.highlightColors) {
                        switch (part) {
                            case "B":
                            case "I":
                            case "P":
                            case "E":
                            case "N":
                            case "D":
                            case "A":
                            case "W":
                            case "R":
                            case "O":
                            case "Y":
                            case "G":
                            case "U":
                            case "S":
                            case "K":
                            case "F":
                            case "*":
                                tokens.push(createToken(part, part))
                                break;
                        }
                    }
                    tokens.push(createToken("default", part))
                    break;
            }
        }

        return tokens;
    }

    const parseCode = (code: string) => {
        const parts = lexCode(code);
        const tokens = tokenizeParts(parts);

        // console.log(parts, tokens)

        return tokens;
    }

    // TODO: Implement local AI... at a much later date
    /*

    let ai = window.ai;
    let model: any;
    let modelResult = $state("")

    const createAISession = async () => model = await ai.createTextSession({
        // initialPrompts: [
        //     {role: "system", content: "Complete the following sentence"},
        //     {role: "user", content: "The quick brown fox jumps"},
        //     {role: "assistant", content: "The quick brown fox jumps over the lazy dog."},
        //     {role: "user", content: "1 + 1 ="},
        //     {role: "assistant", content: "1 + 1 = 2"},
        //     {role: "user", content: "(B=W"},
        //     {role: "assistant", content: "(B=W)"},
        // ],
    });
//     const pretext = `system: Complete the sentence the user gives
// user: Hello, wha
// assistant: Hello, what's up?
// user: 1 + 1 =
// assistant: 1 + 1 = 2
// user: (B=W
// assistant: (B=W)
// user: `;
    const pretext = `Continue what I say: `;
    onMount(createAISession);

    let tokens = $derived(parseCode(code));
    const prompt = async (code: string) => {
        if (model) {
            const prompt = pretext + code;
            const response: string = (await model.prompt(prompt)).trim();
            console.log("Code:", prompt, "\nResponse:", response)

            // There are multiple ways the AI responds back.
            // if (response.startsWith("assistant:")) {
            //     return code + response.slice(11);
            // } else {
            //
            //     // console.warn("AI went off track with\nCode:", prompt, "\nResponse:", response)
            //     return code + " " + response;
            // }

            // return code + response;
            if (response.startsWith(code)) {
                return response;
            } else {
                console.warn("AI went off track with\nCode:", prompt, "\nResponse:", response)
                return code + response;
            }
        } else {
            return code;
        }
    }
    let codeAI = $derived(prompt(code));

     */
    let tokens = $derived(parseCode(code));
</script>

{#snippet token(t)}
    {@const css = parseCSSStyleDeclaration(styles[t.type])}
    <span style={css}>{t.value}</span><!--{#if t.break}<br>{/if}-->
{/snippet}

{#each tokens as t}{@render token(t)}{/each}