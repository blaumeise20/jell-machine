import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { get, writable, Writable } from "svelte/store";
import { appPath, ERR, runningPath, safe, tryAll, tryFirst } from "./misc";
import { $config, config } from "./config";

const textureMapping = {
    "generator": ["generator.png"],
    "mover": ["mover.png"],
    "cwRotator": ["rotatorCW.png", "CWrotator_alt.png"],
    "ccwRotator": ["rotatorCCW.png", "CCWrotator_alt.png"],
    "push": ["push.png"],
    "slide": ["slide.png"],
    "enemy": ["enemy.png"],
    "trash": ["trash.png"],
    "wall": ["wall.png", "immobile.png"],
    "placable": ["BGPlacable.png", "0.png"],
    "bg": ["BG.png", "BGDefault.png"],
};
const uiTextures = {
    "play": "buttonPlay.png",
    "pause": "buttonPause.png"
};

export class Textures {
    currentPack: Writable<TexturePack> = writable(null as any as TexturePack);
    packPaths!: string[];

    static instance: Textures;

    constructor() {
        this.reload();

        config.subscribe(c => {
            if (c.texturePack != get(this.currentPack)?.name) this.use(c.texturePack);
        });
    }

    reload(copied = false) {
        let packs: string[] = [];
        try {
            packs = readdirSync(appPath("textures"), { withFileTypes: true }).filter(f => f.isDirectory()).map(f => f.name);
        }
        catch {
            try {
                mkdirSync(appPath("textures"), { recursive: true });
            }
            catch (e) { ERR() }
        }

        if (packs.length == 0) {
            if (copied) ERR();

            this._copyDefaultPack();
            this.reload(true);
        }
        else this.packPaths = packs.map(p => appPath(p));
    }

    private _copyDefaultPack() {
        try {
            mkdirSync(appPath("textures", "HighRes"));
        }
        catch { ERR() }

        try {
            const packPath = join(runningPath, "../../defaultPack");
            const defaults = readdirSync(packPath);
            tryAll(defaults, file => {
                const filePath = appPath("textures/HighRes", file);
                writeFileSync(filePath, readFileSync(join(packPath, file)));
                return true;
            }) || ERR();
        }
        catch { ERR() }
    }

    load(name: string): TexturePack | false {
        const textures = {} as any;

        for (const k of Object.keys(textureMapping) as (keyof typeof textureMapping)[]) {
            if (!tryFirst(textureMapping[k], filename => {
                const imageContent = safe(() => readFileSync(appPath("textures", name, filename)));
                if (!imageContent[1]) return false;

                const blob = new Blob([new Uint8Array(imageContent[0]).buffer], { type: "image/png" });
                const url = URL.createObjectURL(blob);
                textures[k] = { blob, url };

                return true;
            })) return false;
        }

        return {
            textures,
            ui: this.loadUI(name),
            name
        };
    }

    loadUI(name: string): TexturePack["ui"] {
        const ui = {} as any;

        for (const k of Object.keys(uiTextures) as (keyof typeof uiTextures)[]) {
            const imageContent = safe(() => readFileSync(appPath("textures", name, uiTextures[k])));
            if (!imageContent[1]) continue;

            try {
                const blob = new Blob([new Uint8Array(imageContent[0]).buffer], { type: "image/png" });
                const url = URL.createObjectURL(blob);
                ui[k] = { blob, url };
            }
            catch {}
        }

        return ui;
    }

    use(name: string) {
        let defaultUI = {} as any;
        if (name != "HighRes") defaultUI = this.loadUI(name);

        const pack = this.load(name);
        if (pack) {
            pack.ui = { ...defaultUI, ...pack.ui };
            this.currentPack.set(pack);
            return true;
        }
        else return false;
    }
}

export interface TexturePack {
    name: string;
    textures: {
        generator: Texture;
        mover: Texture;
        cwRotator: Texture;
        ccwRotator: Texture;
        push: Texture;
        slide: Texture;
        enemy: Texture;
        trash: Texture;
        wall: Texture;
        placable: Texture;
        bg: Texture;
    };
    ui: {
        play: Texture;
        pause: Texture;
    };
}
export interface Texture {
    blob: Blob,
    url: string
}

Textures.instance = new Textures();

export const currentPack = Textures.instance.currentPack;

// NOTE: remove later
(window as any).T = Textures;
