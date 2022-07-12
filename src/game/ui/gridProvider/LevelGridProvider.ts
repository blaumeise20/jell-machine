import { CellGrid } from "@core/cells/grid";
import { GridProvider } from "./GridProvider";

export class LevelGridProvider extends GridProvider {
    private initial: CellGrid | null = null;

    constructor(grid: CellGrid) {
        super(grid);
    }

    doStep() {
        if (!this.initial) {
            this.initial = this.grid.clone();
        }
        this.grid.doStep(false);
        this.prevUpdateTime = performance.now();
        this.gridChanged();
    }

    reset() {
        if (this.initial) {
            this.grid = this.initial;
            this.initial = null;
            this.gridChanged();
        }
    }
}
