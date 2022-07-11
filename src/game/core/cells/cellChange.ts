import { Position, PosMap } from "@core/coord/positions";
import { Cell } from "./cell";
import { CellGrid } from "./grid";

export class CellChange {
    public cells: PosMap<Cell | null>;

    constructor() {
        this.cells = new PosMap();
    }

    public addCell(pos: Position, cell: Cell | null) {
        if (!this.cells.has(pos)) {
            this.cells.set(pos, cell);
        }
    }

    public undoOn(grid: CellGrid, callback: (pos: Position, cell: Cell | null) => void) {
        for (const [pos, cell] of this.cells.entries()) {
            if (cell) {
                grid.loadCell(pos, cell.type, cell.direction);
            }
            else {
                grid.cells.get(pos)!.rm();
            }
            callback(pos, cell);
        }
    }
}
