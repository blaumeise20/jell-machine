export const base74Key = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!$%&+-.=?^{}";
export const base74Decode = {} as Record<string, number>;
for (let i = 0; i < base74Key.length; i++) base74Decode[base74Key[i]] = i;
const base = 74;

export function int(x: string) {
    const parsed = parseInt(x);
    if (Number.isNaN(parsed)) throw new Error("");
    return parsed;
}

export function decodeBase74(str: string) {
    let num = 0;
    for (const key of str) {
        num = num * base + (base74Decode[key])
        if (isNaN(num)) throw new Error("Invalid input string");
    };
    return num;
}

export function encodeBase74(num: number) {
    if (num == 0) return "0";
    const arr: number[] = [];
    while (num != 0) {
        arr.unshift(num % base);
        num = Math.floor(num / base);
    }
    return arr.map(n => base74Key[n]).join("");
}
