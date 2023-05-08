import type { CellType } from "@core/cells/cellType";
import type { ItemIdentifier } from "./extensions";
import type { LevelCode } from "./saving/levelCode";
import type { Slot } from "./slot";

export namespace Registry {
    const cells: Record<string, CellType> = {};
    const slots: Slot[] = [];
    const levelCodes: Record<string, LevelCode> = {};

    // cell types
    export function getCell(id: ItemIdentifier): CellType | undefined {
        return cells[id];
    }
    export function getCells(): CellType[] {
        return Object.values(cells);
    }
    export function registerCell(cellType: CellType) {
        cells[cellType.id] = cellType;
    }

    // slots
    export function getSlots() {
        return slots;
    }
    export function registerSlot(slot: Slot) {
        slots.push(slot);
    }

    // level codes
    export function registerLevelCode(levelCode: LevelCode) {
        levelCodes[levelCode.id] = levelCode;
    }
    export function getLevelCode(id: string): LevelCode | undefined {
        return levelCodes[id];
    }
    export function getLevelCodes(): LevelCode[] {
        return Object.values(levelCodes);
    }
}
