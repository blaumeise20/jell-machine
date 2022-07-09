import { Cell } from "@core/cells/cell";
import { CellChange } from "@core/cells/cellChange";
import { CellGrid } from "@core/cells/grid";
import { Position } from "@core/coord/positions";

export const MAX_UNDO_STACK_SIZE = 30;

export abstract class GridProvider {
    public grid: CellGrid;
    public undoStack: CellChange[];

    constructor(grid: CellGrid) {
        this.grid = grid;
        this.undoStack = [];
    }

    public gridChanged() {}

    public abstract doStep(): void;
    public abstract reset(): void;

    public addUndoItem(item: CellChange) {
        this.undoStack.push(item);
        if (this.undoStack.length > MAX_UNDO_STACK_SIZE) {
            this.undoStack.shift();
        }
    }

    public undo() {
        const item = this.undoStack.pop();
        if (!item) return;
        item.undoOn(this.grid);
        this.gridChanged();
    }

    // @ts-expect-error
    public cellPlaced(pos: Position, cell: Cell | null) {}
    public destroy() {}
}
