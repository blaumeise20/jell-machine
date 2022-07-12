import { Cell } from "@core/cells/cell";
import { CellChange } from "@core/cells/cellChange";
import { CellGrid } from "@core/cells/grid";
import { Direction } from "@core/coord/direction";
import { Off, Pos, Position } from "@core/coord/positions";
import { Size } from "@core/coord/size";
import { $config } from "@utils/config";

export const MAX_UNDO_STACK_SIZE = 30;

export abstract class GridProvider {
    public grid: CellGrid;
    public undoStack: CellChange[];
    public prevUpdateTime: number = 0;

    constructor(grid: CellGrid) {
        this.grid = grid;
        this.undoStack = [];
    }

    public getAnimationPercent() {
        return $config.animation
            ? Math.min(1, (performance.now() - this.prevUpdateTime) / $config.tickSpeed)
            : 1;
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
        item.undoOn(this.grid, (pos, cell) => this.cellPlaced(pos, cell));
        this.gridChanged();
    }

    public placeCell(pos: Position, cell: Cell | null) {
        this.cellPlaced(pos, cell);
    }

    public clearArea(area: Size) {
        for (let x = area.left; x < area.left + area.width; x++) {
            for (let y = area.bottom; y < area.bottom + area.height; y++) {
                this.placeCell(new Position(x, y), null);
            }
        }
        this.gridChanged();
    }

    public moveArea(area: Size, where: Direction) {
        const offset = Off[where];

        const moveCell = (x: number, y: number) => {
            const cellPos = Pos(x, y);
            const newPos = cellPos.mi(offset);
            const cell = this.grid.cells.get(cellPos);
            if (cell) {
                cell.rm();
                this.grid.loadCell(newPos, cell.type, cell.direction);
                this.cellPlaced(cellPos, null);
                this.cellPlaced(newPos, cell);
            }
        };

        switch (where) {
            case Direction.Right:
            case Direction.Up:
                for (let x = area.left + area.width - 1; x >= area.left; x--)
                    for (let y = area.bottom + area.height - 1; y >= area.bottom; y--)
                        moveCell(x, y);
                break;
            case Direction.Left:
            case Direction.Down:
                for (let x = area.left; x < area.left + area.width; x++)
                    for (let y = area.bottom; y < area.bottom + area.height; y++)
                        moveCell(x, y);
                break;
        }
    }

    // @ts-expect-error
    public cellPlaced(pos: Position, cell: Cell | null) {}
    public destroy() {}
}
