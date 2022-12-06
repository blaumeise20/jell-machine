import { invoke } from "@tauri-apps/api";

export const isWeb = !(window as any).__TAURI__;

export function resolvePath(...paths: string[]): string {
    let result = paths[0];
    for (const path of paths.slice(1)) {
        if (path.startsWith("/")) {
            result = path;
        }
        else {
            if (result.endsWith("/")) {
                result = result.substr(0, result.length - 1);
            }
            const parts = path.split("/");
            for (const part of parts) {
                if (part === "..") {
                    result = result.substr(0, result.lastIndexOf("/"));
                }
                else {
                    result += "/" + part;
                }
            }
        }
    }
    return result;
}

export function quit() {
    invoke("quit");
}
