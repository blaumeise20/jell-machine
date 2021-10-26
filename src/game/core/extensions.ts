import { safe } from "@utils/misc";
import { CellType, CellTypeOptions } from "./cell";
import type { UpdateType } from "./cellUpdates";
import type { CellGrid } from "./grid";
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
}

export class ExtensionContext {
    constructor(public extension: Extension) {

    }

    createCellType(options: CellTypeOptions): CellType {
        const cellType = CellType.create(options);
        this.extension.cells.push(cellType);
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
