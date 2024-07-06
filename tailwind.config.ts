import type { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {}
    },
    plugins: [],
    safelist: [
        // For Guide.svelte
        {
            pattern: /bg-(.+)-900\/40/,
        },
        {
            pattern: /outline-(.+)-500/,
        }
    ]
} as Config;