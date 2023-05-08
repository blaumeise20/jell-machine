import { writable, type Writable } from "svelte/store";
import { config } from "./config";
import { BaseDirectory, createDir, readBinaryFile, readDir } from "@tauri-apps/api/fs";
import { loadingPromises } from "./misc";

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
    note: ["note.png"],
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

    placeable: ["BGPlaceable.png", "0.png"],
    bg: ["BG.png", "BGDefault.png"],
    border: ["_.png"],
    unknown: ["unknown.png"],
};
const uiTextures = {
    play: "buttonPlay.png",
    pause: "buttonPause.png",
    structures: "buttonStructures.png",
};

class Textures {
    currentPack: Writable<TexturePack> = writable(null as any as TexturePack);
    defaultPack!: TexturePack;
    packPaths: string[] = [];
    supported = true;

    static instance: Textures;

    constructor() {
        loadingPromises.push(this.init());
    }

    async init() {
        await this.loadDefaultPack();

        try {
            // try read texture packs
            const packs = await readDir("textures", { dir: BaseDirectory.AppData });
            for (const pack of packs) {
                this.packPaths.push(pack.name!);
            }
        } catch (e1) {
            try {
                // packs don't exist
                await createDir("textures", { recursive: true, dir: BaseDirectory.AppData });
                this.packPaths = [];
            } catch (e2) {
                // can't create pack folder, texture packs not supported
                this.supported = false;
            }
        }

        config.subscribe((c) => {
            if (!c.texturePack) {
                this.currentPack.set(this.defaultPack);
            }
            else {
                this.use(c.texturePack);
            }
        });
    }

    async loadDefaultPack(): Promise<void> {
        const cells = {} as any;

        const files = import.meta.glob("/assets/defaultPack/*.png", {
            eager: true,
            import: "default",
            query: { blob: true },
        });

        for (const k of Object.keys(textureMapping) as (keyof typeof textureMapping)[]) {
            for (const filename of textureMapping[k]) {
                const blob = files[`/assets/defaultPack/${filename}`] as Blob;
                const url = URL.createObjectURL(blob);
                createImageBitmap(blob).then(bitmap => {
                    cells[k] = { blob, url, bitmap };
                });

                break;
            }
        }

        this.defaultPack = {
            cells,
            ui: {} as any,
            name: false,
        };
    }

    async load(name: string): Promise<TexturePack | false> {
        const cells = {} as any;

        t: for (const k of Object.keys(textureMapping) as (keyof typeof textureMapping)[]) {
            for (const filename of textureMapping[k]) {
                let imageContent: Uint8Array;
                try {
                    imageContent = await readBinaryFile(`textures/${name}/${filename}`, { dir: BaseDirectory.AppData });
                }
                catch {
                    continue;
                }

                const blob = new Blob(
                    [imageContent.buffer],
                    { type: "image/png" }
                );
                const url = URL.createObjectURL(blob);
                createImageBitmap(blob).then(bitmap => {
                    cells[k] = { blob, url, bitmap };
                });

                continue t;
            }
            return false;
        }

        return {
            cells,
            ui: await this.loadUI(name),
            name,
        };
    }

    async loadUI(name: string): Promise<TexturePack["ui"]> {
        const ui = {} as any;

        for (const k of Object.keys(uiTextures) as (keyof typeof uiTextures)[]) {
            let imageContent: Uint8Array;
            try {
                imageContent = await readBinaryFile(`textures/${name}/${uiTextures[k]}`, { dir: BaseDirectory.AppData });
            }
            catch {
                continue;
            }

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

    async use(name: string) {
        let defaultUI = {} as any;
        if (name) defaultUI = await this.loadUI(name);

        const pack = await this.load(name);
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
        structures: Texture;
    };
}
export interface Texture {
    blob: Blob;
    url: string;
    bitmap: ImageBitmap;
}

Textures.instance = new Textures();

export const textures = Textures.instance.currentPack;

export let currentTextures: TexturePack;
textures.subscribe(t => currentTextures = t);
