import { writable } from "svelte/store";
import { loadingPromises, safe } from "./misc";
import { isWeb } from "./platform";
import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";

async function write(config: Config) {
    const newConfig = {} as Record<string, any>;

    for (const key in config) {
        if (config.hasOwnProperty(key)) {
            // @ts-ignore
            const val = config[key], def = ConfigManager.default[key];
            if (val !== def) {
                newConfig[key] = val;
            }
        }
    }

    if (isWeb) localStorage.setItem("config", JSON.stringify(newConfig));
    else await writeTextFile("config.json", JSON.stringify(newConfig), { dir: BaseDirectory.AppData });
}

const defaultConfig = {
    texturePack: false as string | false,
    tickSpeed: 200,
    uiScale: 1,
    keyboardOnly: false,
    animation: true,
    showDebug: false,
    showBackgroundGrid: true,
    troh: 1,
};

export type Config = typeof defaultConfig;

export const config = writable<Config>({} as Config);
loadingPromises.push((async () => {
    let file: Partial<Config>;
    if (isWeb) {
        const data = localStorage.getItem("config");
        if (data) file = safe(() => JSON.parse(data), defaultConfig)[0];
        else file = defaultConfig;
    }
    else {
        try {
            file = JSON.parse(await readTextFile("config.json", { dir: BaseDirectory.AppData }));
        }
        catch {
            file = defaultConfig;
        }
    }

    config.set({ ...defaultConfig, ...file });

    config.subscribe(async c => {
        try {
            await write(c);
        }
        catch {
            // ignore
        }
    });
})());


export let $config = defaultConfig;
config.subscribe(v => $config = v);
