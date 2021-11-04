import { safe } from "@utils/misc";
import { CellType, CellTypeOptions } from "./cells/cellType";
import type { UpdateType } from "./cells/cellUpdates";
import type { CellGrid } from "./cells/grid";
import { Registry } from "./registry";
import { Slot } from "./slot";

/**
 * An unique identifier for every item (tools, cell types, etc.) in the game.
 */
export type ItemIdentifier = string;

export type ExtensionLoader = (context: ExtensionContext) => void | Record<string, any>;

export class Extension {
    id!: string;
    cells: CellType[] = [];
    data!: Record<string, any>;
    slots: Slot[] = [];
    levelCodes: [string, (parts: string[], grid: CellGrid) => false | void][] = [];
    tools: Record<string, { name: string, viewText: string, runTool: (grid: CellGrid) => void }> = {};

    events: Record<string, ((...args: any[]) => void)[]> = {};

    emit(event: string, ...args: any[]): void {
        if (this.events[event]) {
            this.events[event].forEach(fn => safe(() => fn(...args)));
        }
    }

    static extensions: Extension[] = [];
    static slots: Slot[] = [];
    static levelCodes: Record<string, (parts: string[], grid: CellGrid) => false | void> = {};
    static tools: Record<string, { name: string, viewText: string, runTool: (grid: CellGrid) => void }> = {};

    static load(id: string, extensionLoader: ExtensionLoader) {
        const extension = new Extension();
        extension.id = id;

        extension.data = extensionLoader(new ExtensionContext(extension)) || {};

        this.extensions.push(extension);
        return extension;
    }

    static get(id: string): Extension | undefined {
        return this.extensions.find(e => e.id === id);
    }

    static getUpdateOrder(): [CellType, UpdateType][] {
        const result: [CellType, UpdateType][] = [];

        this.extensions.forEach(extension => {
            extension.cells.forEach(cell => {
                if (cell.options.updateType != null) {
                    result.push([cell, cell.options.updateType]);
                }
            });
        });

        return result.sort((a, b) => a[0].options.updateOrder! - b[0].options.updateOrder!);
    }


    static createExtension(name: string, identifier: string, data: {}, code: string) {
        let text: string[] = [];

        text.push("Jell Machine Extension\u0000");

        text.push(name);
        text.push("\u0001");

        text.push(identifier);
        text.push("\u0001");



        text.push(JSON.stringify(data));
        text.push("\u0002");

        text.push(code);

        return text.join("");
    }

    static parseExtension(text: string): false | { name: string, data: {}, code: string } {
        if (!text.startsWith("Jell Machine Extension\u0000")) return false;

        text = text.substr("Jell Machine Extension\u0000".length);

        const name = text.split("\u0001")[0];
        text = text.substr(name.length + 1);

        const data = JSON.parse(text.split("\u0002")[0]);
        text = text.substr(JSON.stringify(data).length + 1);

        const code = text;

        return { name, data, code };
    }
}

console.log(Extension.parseExtension("Jell Machine Extension\u0000Test\u0001{}\u0002console.log(\"Hello World!\");"));

export class ExtensionContext {
    constructor(public extension: Extension) {

    }

    createCellType(id: ItemIdentifier, options: CellTypeOptions): CellType {
        const cellType = CellType.create(options, id);
        this.extension.cells.push(cellType);
        Registry.registerCell(cellType);
        return cellType;
    }

    addSlot(...t: (CellType | CellType[])[]): void {
        const slot = new Slot(t.flatMap(t => Array.isArray(t) ? t : [t]));
        this.extension.slots.push(slot);
        Extension.slots.push(slot);
    }

    createLevelCode(identification: string, parse: (parts: string[], grid: CellGrid) => false | void): void {
        this.extension.levelCodes.push([identification, parse]);
        Extension.levelCodes[identification] = parse;
    }

    createTool(name: string, viewText: string, runTool: (grid: CellGrid) => void): void {
        this.extension.tools[name] = { name, viewText, runTool };
        Extension.tools[name] = { name, viewText, runTool };
    }

    on(event: string, fn: (...args: any[]) => void): void {
        if (!this.extension.events[event]) this.extension.events[event] = [];
        this.extension.events[event].push(fn);
    }
}
