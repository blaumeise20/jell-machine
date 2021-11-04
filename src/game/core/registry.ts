import type { CellType } from "./cells/cellType";
import type { ItemIdentifier } from "./extensions";
import type { LevelCode } from "./levelCode";
import type { Slot } from "./slot";

export class Registry {
    static cells: Record<string, CellType> = {};
    static slots: Slot[] = [];
    static levelCodes: Record<string, LevelCode> = {};


    private constructor() {}

    // cell types
    static getCell(id: ItemIdentifier): CellType | undefined {
        return this.cells[id];
    }
    static getCells(): CellType[] {
        return Object.values(this.cells);
    }
    static registerCell(cellType: CellType) {
        this.cells[cellType.id] = cellType;
    }

    // slots
    static getSlots() {
        return this.slots;
    }

    // level codes
    static registerLevelCode(levelCode: LevelCode) {
        this.levelCodes[levelCode.id] = levelCode;
    }
    static getLevelCode(id: string): LevelCode | undefined {
        return this.levelCodes[id];
    }
    static getLevelCodes(): LevelCode[] {
        return Object.values(this.levelCodes);
    }
}
