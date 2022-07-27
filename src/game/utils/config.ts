import { Writable, writable } from "svelte/store";
import { safe } from "./misc";
import { getFs, appPath } from "./platform";

const fs = getFs();

const configPath = appPath("config.json");
function write(config: Config) {
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

    if (fs) fs.writeFileSync(configPath, JSON.stringify(newConfig));
    else localStorage.setItem("config", JSON.stringify(newConfig));
}

class ConfigManager {
    static instance: ConfigManager;
    static default = {
        texturePack: false as string | false,
        tickSpeed: 200,
        uiScale: 1,
        animation: true,
        showDebug: false,
        showBackgroundGrid: true,
        troh: 1,
    };

    constructor() { return ConfigManager.instance ?? (this.init(), ConfigManager.instance = this) }

    static $: Writable<Config>;

    init() {
        const config = writable<any>({});
        let file: Partial<Config>;
        if (fs) {
            file = safe(() => JSON.parse(fs.readFileSync(configPath, "utf8")), ConfigManager.default)[0];
        }
        else {
            const data = localStorage.getItem("config");
            if (data) file = safe(() => JSON.parse(data), ConfigManager.default)[0];
            else file = ConfigManager.default;
        }

        // TODO(maybe): remove on release
        // if (file.texturePack == "HighRes") file.texturePack = false;
        file.texturePack = false;

        config.subscribe(c => {
            safe(() => write(c));
        });

        config.set({ ...ConfigManager.default, ...file });

        ConfigManager.$ = config;
    }
}

export type Config = typeof ConfigManager.default;

ConfigManager.instance = new ConfigManager();

export const config = ConfigManager.$;
export let $config = ConfigManager.default;
ConfigManager.$.subscribe(v => $config = v);
