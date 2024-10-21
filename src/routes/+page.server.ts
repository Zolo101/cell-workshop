export const ssr = false;

// https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing#reduced_precision
// Blocked because of https://github.com/sveltejs/kit/issues/9408
// export function load({ setHeaders }) {
//     setHeaders({
//         "Cross-Origin-Opener-Policy": "same-origin",
//         "Cross-Origin-Embedder-Policy": "require-corp"
//     });
// }