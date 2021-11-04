import { CellGrid } from "./cells/grid";
import { Registry } from "./registry";

export class LevelCode {
    public importFn: (parts: string[], grid: CellGrid) => boolean | void = () => false;
    public exportFn: (grid: CellGrid) => string | false = () => false;

    private constructor(public id: string) {}

    public import(fn: (parts: string[], grid: CellGrid) => boolean | void) {
        this.importFn = fn;
        return this;
    }

    public export(fn: (grid: CellGrid) => string) {
        this.exportFn = fn;
        return this;
    }

    public static create(id: string): LevelCode {
        const levelCode = new LevelCode(id);
        Registry.registerLevelCode(levelCode);
        return levelCode;
    }
}
