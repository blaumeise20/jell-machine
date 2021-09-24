import { CellType, CellTypeOptions } from "./cell";

export interface ExtensionContext {
    addSlot(t: CellType): void;
    createCellType(options: CellTypeOptions): CellType;
    on(event: string, fn: (...args: any[]) => void): void;
}

export type ExtensionLoader = (context: ExtensionContext) => void | Record<string, any>;

export class Extension {
    cells: CellType[] = [];
    id!: string;
    data!: Record<string, any>;

    events: Record<string, ((...args: any[]) => void)[]> = {};

    emit(event: string, ...args: any[]): void {
        if (this.events[event]) {
            this.events[event].forEach(fn => safe(() => fn(...args)));
        }
    }

    static extensions: Extension[] = [];

    static load(id: string, extensionLoader: ExtensionLoader) {
        const extension = new Extension();
        extension.id = id;

        extension.data = extensionLoader({
            createCellType(options: CellTypeOptions) {
                const cellType = CellType.create(options);
                extension.cells.push(cellType);
                return cellType;
            },
            addSlot(t: CellType) {

            },
            on(event: string, fn: (...args: any[]) => void) {
                if (!extension.events[event]) extension.events[event] = [];
                extension.events[event].push(fn);
            }
        }) || {};

        this.extensions.push(extension);
        return extension;
    }

    static get(id: string): Extension | undefined {
        return this.extensions.find(e => e.id === id);
    }
}
