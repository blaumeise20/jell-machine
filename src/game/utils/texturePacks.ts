import { getFs, appPath, resolvePath, runningPath } from "./platform";
import { writable, Writable } from "svelte/store";
import {
    safe,
    tryFirst,
} from "./misc";
import { config } from "./config";

if (!getFs()) throw new Error();
const { mkdirSync, readdirSync, readFileSync } = getFs()!;

const textureMapping = {
    generator: ["generator.png"],
    mover: ["mover.png"],
    cwRotator: ["rotatorCW.png", "CWrotator_alt.png"],
    ccwRotator: ["rotatorCCW.png", "CCWrotator_alt.png"],
    push: ["push.png"],
    slide: ["slide.png"],
    arrow: ["arrow.png"],
    enemy: ["enemy.png"],
    trash: ["trash.png"],

    wall: ["wall.png", "immobile.png"],
    note: ["note.png", "music.png"],
    orientator: ["orientator.png"],
    disabler: ["disabler.png"],
    jell: ["jell.png"],
    random: ["random.png"],
    portal: ["portal.png"],
    portalOff: ["portalOff.png"],
    nuke: ["nuke.png"],

    pistonOn: ["pistonOn.png"],
    pistonOff: ["pistonOff.png"],
    pistonHead: ["pistonHead.png"],
    pistonSticky: ["pistonSticky.png"],
    pistonStickyHead: ["pistonStickyHead.png"],

    redirector: ["redirector.png"],
    tunnel: ["tunnel.png"],
    crossway: ["crossway.png"],
    crossdirector: ["crossdirector.png"],

    network: ["network.png"],

    placable: ["BGPlacable.png", "0.png"],
    bg: ["BG.png", "BGDefault.png"],
    border: ["_.png"]
};
const uiTextures = {
    play: "buttonPlay.png",
    pause: "buttonPause.png",
};

class Textures {
    currentPack: Writable<TexturePack> = writable(null as any as TexturePack);
    defaultPack: TexturePack;
    packPaths!: string[];
    supported = true;

    static instance: Textures;

    constructor() {
        this.defaultPack = this.loadDefaultPack();

        try {
            // try read texture packs
            const packs = readdirSync(appPath("textures"), { withFileTypes: true })
                .filter((f) => f.isDirectory())
                .map((f) => f.name);

            this.packPaths = packs.map((p) => appPath(p));
        } catch (e1) {
            try {
                // packs don't exist
                mkdirSync(appPath("textures"), { recursive: true });
                this.packPaths = [];
            } catch (e2) {
                // can't create pack folder, texture packs not supported
                this.supported = false;
            }
        }

        config.subscribe((c) => {
            console.log("hi");
            if (!c.texturePack) {
                console.log("hi2");
                this.currentPack.set(this.defaultPack);
            }
            else {
                this.use(c.texturePack);
            }
        });
    }

    loadDefaultPack() {
        const path = resolvePath(runningPath, "../../assets/defaultPack");
        const textures = this.load(false, path)
        console.log(path, textures);
        return textures as TexturePack;
    }

    load(name: string | false, path: string): TexturePack | false {
        const cells = {} as any;

        for (const k of Object.keys(textureMapping) as (keyof typeof textureMapping)[]) {
            if (
                !tryFirst(textureMapping[k], (filename) => {
                    const imageContent = safe(() => readFileSync(path + "/" + filename));
                    if (!imageContent[1]) return false;

                    const blob = new Blob(
                        [new Uint8Array(imageContent[0]).buffer],
                        { type: "image/png" }
                    );
                    const url = URL.createObjectURL(blob);
                    cells[k] = { blob, url };

                    return true;
                })
            )
                return false;
        }

        return {
            cells,
            ui: this.loadUI(path),
            name,
        };
    }

    loadUI(path: string): TexturePack["ui"] {
        const ui = {} as any;

        for (const k of Object.keys(uiTextures) as (keyof typeof uiTextures)[]) {
            const imageContent = safe(() => readFileSync(path + "/" + uiTextures[k]));
            if (!imageContent[1]) continue;

            try {
                const blob = new Blob(
                    [new Uint8Array(imageContent[0]).buffer],
                    { type: "image/png" }
                );
                const url = URL.createObjectURL(blob);
                ui[k] = { blob, url };
            } catch {}
        }

        return ui;
    }

    use(name: string) {
        let defaultUI = {} as any;
        if (name) defaultUI = this.loadUI(name);

        const pack = this.load(name, appPath("textures", name));
        if (pack) {
            pack.ui = { ...defaultUI, ...pack.ui };
            this.currentPack.set(pack);
            return true;
        } else return false;
    }
}

export interface TexturePack {
    name: string | false;
    cells: Record<string, Texture>;
    ui: {
        play: Texture;
        pause: Texture;
    };
}
export interface Texture {
    blob: Blob;
    url: string;
}

Textures.instance = new Textures();

export const textures = Textures.instance.currentPack;
