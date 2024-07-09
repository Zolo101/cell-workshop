export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// TODO: Put this in a "misc.ts" eventually
// Assuming arrays are ordered
export const isEqualArrays = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}