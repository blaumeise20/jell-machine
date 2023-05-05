import { Position, PosMap } from "@core/coord/positions";
import type { Cell } from "./cell";
import type { CellGrid } from "./cellGrid";

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

export class UndoStack {
    public stack: CellChange[];
    public current: CellChange;

    constructor() {
        this.stack = [];
        this.current = new CellChange();
    }

    public addCell(pos: Position, cell: Cell | null) {
        this.current.addCell(pos, cell);
    }

    public finish() {
        this.stack.push(this.current);
        this.current = new CellChange();
    }

    public undoOn(grid: CellGrid, callback: (pos: Position, cell: Cell | null) => void) {
        const item = this.stack.pop();
        if (!item) return false;
        item.undoOn(grid, callback);
        return true;
    }
}
