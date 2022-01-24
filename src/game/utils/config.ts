import { Writable, writable } from "svelte/store";
import { safe } from "./misc";
import { getFs, appPath } from "./platform";

const fs = getFs();

const configPath = appPath("config.json");
function write(config: Config) {
    if (fs) fs.writeFileSync(configPath, JSON.stringify(config));
    else localStorage.setItem("config", JSON.stringify(config));
}

class ConfigManager {
    static instance: ConfigManager;
    static default = { texturePack: false as string | false, tickSpeed: 200, hotbarSize: 70, animation: false, showDebug: false, showBackgroundGrid: true };

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
        if (file.texturePack == "HighRes") file.texturePack = false;

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
