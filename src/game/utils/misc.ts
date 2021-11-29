import { clipboard } from "electron";
import { join } from "path";

const hashData = JSON.parse(decodeURIComponent(window.location.hash.substr(1)));

export const appPath = (...paths: string[]) => join(appPath.path, ...paths);
appPath.path = hashData[0];
export const runningPath = hashData[1];

export function safe<T>(fn: () => T): [T, true] | [null, false];
export function safe<T>(fn: () => T, fallback: T): [T, true] | [null, false];
export function safe(fn: () => any, fallback = null): [any, boolean] {
	try {
		return [fn(), true];
	}
	catch {
		return [fallback, false];
	}
}

export function tryFirst<T>(arr: T[], fn: (t: T) => boolean) {
    for (const t of arr) {
        const result = safe(() => fn(t));
        if (result[0] && result[1]) return true;
    }
    return false;
}

export function tryAll<T>(arr: T[], fn: (t: T) => boolean) {
    for (const t of arr) {
        const result = safe(() => fn(t));
        if (!result[0] || !result[1]) return false;
    }
    return true;
}

export function tryAllContinue<T>(arr: T[], fn: (t: T) => boolean) {
    let errors = false;
    for (const t of arr) {
        const result = safe(() => fn(t));
        if (!result[0] || !result[1]) errors = true;
    }
    return !errors;
}

export function clip(): string;
export function clip(text: string): void;
export function clip(text?: string) {
    if (text != undefined) return clipboard.writeText(text);
    return clipboard.readText();
}

export function ERR() {
    alert("something bad happened but i don't know why\nplease contact a dev AAAA");
    window.close();
}
