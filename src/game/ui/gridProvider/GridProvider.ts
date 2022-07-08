import { Cell } from "@core/cells/cell";
import { CellGrid } from "@core/cells/grid";
import { Position } from "@core/coord/positions";

export abstract class GridProvider {
    public grid: CellGrid;

    constructor(grid: CellGrid) {
        this.grid = grid;
    }

    public gridChanged() {}

    public abstract doStep(): void;
    public abstract reset(): void;

    // @ts-expect-error
    public cellPlaced(pos: Position, cell: Cell | null) {}
    public destroy() {}
}
