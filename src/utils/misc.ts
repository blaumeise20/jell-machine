import { isWeb } from "./platform";
import { readText, writeText } from "@tauri-apps/api/clipboard";

export const loadingPromises: Promise<any>[] = [];

export function safe<T>(fn: () => T): [T, true] | [null, false];
export function safe<T>(fn: () => T, fallback: T): [T, true] | [T, false];
export function safe(fn: () => any, fallback = null): [any, boolean] {
	try {
		return [fn(), true];
	}
	catch {
		return [fallback, false];
	}
}

export function clip(): Promise<string>;
export function clip(text: string): Promise<void>;
export function clip(text?: string) {
    if (isWeb) {
        if (text != undefined) return navigator.clipboard.writeText(text);
        return navigator.clipboard.readText();
    }
    else {
        if (text != undefined) return writeText(text);
        return readText();
    }
}

export function lazy<T>(fn: () => T) {
    let value: T;
    let init = false;
    return () => {
        if (!init) {
            value = fn();
            init = true;
        }
        return value;
    }
}
