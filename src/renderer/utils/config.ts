import { readFileSync, writeFileSync } from "fs";
import { Writable, writable } from "svelte/store";
import { appPath, safe } from "./misc";

export class Config {
    static instance: Config;
    static default = { texturePack: "HighRes", tickSpeed: 200 };

    constructor() { return Config.instance ?? (this.init(), Config.instance = this) }

    static $: Writable<typeof Config.default>;

    init() {
        const config = writable<any>({});
        const file = safe(() => JSON.parse(readFileSync(appPath("config.json")).toString()), Config.default);
        if (file[1]) file[0] = { ...Config.default, ...file[0] };
        config.set(file[0]);

        config.subscribe(c => {
            safe(() => writeFileSync(appPath("config.json"), JSON.stringify(c)));
        });

        Config.$ = config;
    }
}

Config.instance = new Config();

export const config = Config.$;
export let $config = Config.default;
Config.$.subscribe(v => $config = v);
