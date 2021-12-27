import { join } from "path";

let fs: typeof import("fs") | undefined = undefined;
let electronIpc: typeof import("electron").ipcRenderer | undefined = undefined;
if (typeof require == "function") {
    fs = require("fs");
    electronIpc = require("electron").ipcRenderer;
}

export function isElectron(): boolean {
    return electronIpc !== undefined;
}

export function appPath(...paths: string[]): string {
    return join(appPath.path, ...paths);
}

const hashData = JSON.parse(decodeURIComponent(window.location.hash.substr(1)));

appPath.path = hashData[0];
export const runningPath = hashData[1];


export function getFs() {
    return fs;
}

export function sendIpcError(data: string) {
    if (electronIpc)
        electronIpc.send("ERR", data);
}

export function resolvePath(...paths: string[]): string {
    let result = "";
    for (const path of paths) {
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
