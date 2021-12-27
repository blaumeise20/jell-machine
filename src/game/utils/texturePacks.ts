import { getFs, appPath, runningPath, resolvePath } from "./platform";
import { get, writable, Writable } from "svelte/store";
import {
    ERR,
    safe,
    tryAllContinue,
    tryFirst,
} from "./misc";
import { config } from "./config";

if (!getFs()) throw new Error();
const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = getFs()!;

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
    structures: "buttonStructures.png",
};

export class Textures {
    currentPack: Writable<TexturePack> = writable(null as any as TexturePack);
    packPaths!: string[];

    static instance: Textures;

    constructor() {
        this.reload();

        config.subscribe((c) => {
            if (c.texturePack != get(this.currentPack)?.name)
                this.use(c.texturePack);
        });
    }

    reload() {
        this._copyDefaultPack();

        let packs: string[] = [];
        try {
            packs = readdirSync(appPath("textures"), { withFileTypes: true })
                .filter((f) => f.isDirectory())
                .map((f) => f.name);
        } catch (e1) {
            try {
                mkdirSync(appPath("textures"), { recursive: true });
            } catch (e2) {
                ERR({ e1, e2, msg: "Could not create textures directory, threw error" });
            }
        }

        if (packs.length == 0)
            ERR({ msg: "No texture packs found" });
        else
            this.packPaths = packs.map((p) => appPath(p));
    }

    private _copyDefaultPack() {
        try {
            const path = appPath("textures", "HighRes");
            if (!existsSync(path))
                mkdirSync(path);
        } catch (e) {
            ERR({ e, msg: "Could not create default pack directory" });
        }

        try {
            const packPath = resolvePath(runningPath, "../../assets/defaultPack");
            const defaults = readdirSync(packPath);
            const errors = tryAllContinue(defaults, (file) => {
                const filePath = appPath("textures/HighRes", file);
                writeFileSync(filePath, readFileSync(resolvePath(packPath, file)));
                return true;
            });
            if (errors.length > 0)
                ERR({ errors, msg: "Could not copy default pack" });
        } catch (e) {
            ERR({ e, msg: "Could not copy default pack, threw error" });
        }
    }

    load(name: string): TexturePack | false {
        const textures = {} as any;

        for (const k of Object.keys(
            textureMapping
        ) as (keyof typeof textureMapping)[]) {
            if (
                !tryFirst(textureMapping[k], (filename) => {
                    const imageContent = safe(() =>
                        readFileSync(appPath("textures", name, filename))
                    );
                    if (!imageContent[1]) return false;

                    const blob = new Blob(
                        [new Uint8Array(imageContent[0]).buffer],
                        { type: "image/png" }
                    );
                    const url = URL.createObjectURL(blob);
                    textures[k] = { blob, url };

                    return true;
                })
            )
                return false;
        }

        return {
            textures,
            ui: this.loadUI(name),
            name,
        };
    }

    loadUI(name: string): TexturePack["ui"] {
        const ui = {} as any;

        for (const k of Object.keys(
            uiTextures
        ) as (keyof typeof uiTextures)[]) {
            const imageContent = safe(() =>
                readFileSync(appPath("textures", name, uiTextures[k]))
            );
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
        if (name != "HighRes") defaultUI = this.loadUI(name);

        const pack = this.load(name);
        if (pack) {
            pack.ui = { ...defaultUI, ...pack.ui };
            this.currentPack.set(pack);
            return true;
        } else return false;
    }
}

export interface TexturePack {
    name: string;
    textures: Record<string, Texture>;
    ui: {
        play: Texture;
        pause: Texture;
        structures: Texture;
    };
}
export interface Texture {
    blob: Blob;
    url: string;
}

Textures.instance = new Textures();

export const currentPack = Textures.instance.currentPack;
