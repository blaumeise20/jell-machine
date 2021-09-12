import { CellType, CellTypeOptions } from "./cell";

export interface ExtensionContext {
    addSlot(t: CellType): void;
    createCellType(options: CellTypeOptions): CellType;
}

export type ExtensionLoader = (context: ExtensionContext) => void | Record<string, any>;

export class Extension {
    cells: CellType[] = [];
    id!: string;
    data!: Record<string, any>;

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

            }
        }) || {};

        this.extensions.push(extension);
        return extension;
    }

    static get(id: string): Extension | undefined {
        return this.extensions.find(e => e.id === id);
    }
}
