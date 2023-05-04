import { Pos, Position, PosMap } from "@core/coord/positions";
import { Registry } from "@core/registry";
import type { Cell } from "./cell";
import type { CellType } from "./cellType";

export const CHUNK_HEIGHT = 16;
export const CHUNK_WIDTH = 16;

export class CellCollection {
    readonly positions: PosMap<Cell> = new PosMap();
    readonly groups: Map<CellType, Set<Cell>> = new Map();
    readonly chunks: PosMap<Set<Cell>> = new PosMap();

    constructor() {
        for (const type of Registry.getCells()) {
            this.groups.set(type, new Set());
        }
    }

    group_insert(cell: Cell) {
        this.groups.get(cell.type)!.add(cell);
    }

    group_delete(cell: Cell) {
        this.groups.get(cell.type)!.delete(cell);
    }

    group_get(type: CellType) {
        return this.groups.get(type)?.values() ?? [];
    }

    set(pos: Position, cell: Cell) {
        this.positions.set(pos, cell);

        const chunk = Pos(Math.floor(pos.x / CHUNK_WIDTH), Math.floor(pos.y / CHUNK_HEIGHT));
        let chunkSet = this.chunks.get(chunk);
        if (!chunkSet) {
            chunkSet = new Set();
            this.chunks.set(chunk, chunkSet);
        }
        chunkSet.add(cell);
    }
    get(pos: Position) {
        return this.positions.get(pos);
    }
    delete(pos: Position) {
        this.positions.delete(pos);
    }
}
