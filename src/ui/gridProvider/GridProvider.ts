import type { Cell } from "@core/cells/cell";
import { UndoStack } from "@core/cells/cellChange";
import type { CellType } from "@core/cells/cellType";
import type { CellGrid } from "@core/cells/grid";
import { Direction } from "@core/coord/direction";
import { Off, Pos, Position } from "@core/coord/positions";
import type { Size } from "@core/coord/size";
import { $config } from "@utils/config";
import { writable } from "svelte/store";

export const MAX_UNDO_STACK_SIZE = 30;

export abstract class GridProvider {
    public grid: CellGrid;
    public undoStack: UndoStack;
    public prevUpdateTime: number = 0;
    public isInitial = writable(true);

    constructor(grid: CellGrid) {
        this.grid = grid;
        this.undoStack = new UndoStack();
    }

    public getAnimationPercent() {
        return $config.animation
            ? Math.min(1, (performance.now() - this.prevUpdateTime) / $config.tickSpeed)
            : 1;
    }

    public gridChanged() {}

    public abstract doStep(): void;
    public abstract reset(): void;

    public undo() {
        if (this.undoStack.undoOn(this.grid, (pos, cell) => this.cellPlaced(pos, cell))) {
            this.gridChanged();
        }
    }

    public placeCell(pos: Position, cellType: CellType | null, direction: Direction = Direction.Right) {
        const originalCell = this.grid.cells.get(pos);
        if (cellType) {
            if (!originalCell || originalCell.type != cellType || originalCell.direction != direction) {
                if (this.grid.isInfinite || this.grid.size.contains(pos)) {
                    const cell = this.grid.loadCell(pos, cellType, direction)!;
                    // Events.emit("cell-placed", pos, cell); TODO: fix portal
                    this.cellPlaced(pos, cell as Cell);
                    this.undoStack.addCell(pos, originalCell);
                }
            }
        } else {
            if (originalCell) {
                originalCell.rm();
                // Events.emit("cell-deleted", pos, originalCell); TODO: fix portal
                this.cellPlaced(pos, null);
                this.undoStack.addCell(pos, originalCell);
            }
        }
    }

    public insertArea(pos: Position, grid: CellGrid, smartMerge: boolean) {
        for (const cell of grid.cells.values()) {
            const newPos = Pos(cell.pos.x + pos.x, cell.pos.y + pos.y);
            const cellAt = grid.cells.get(newPos);
            if (cellAt && smartMerge) {
                const newData = cellAt.type.merge(cellAt, cell);
                this.placeCell(newPos, newData[0], newData[1]);
            }
            else {
                this.placeCell(newPos, cell.type, cell.direction);
            }
        }
    }

    public clearArea(area: Size) {
        for (let x = area.left; x < area.left + area.width; x++) {
            for (let y = area.bottom; y < area.bottom + area.height; y++) {
                this.placeCell(Pos(x, y), null);
            }
        }
        this.gridChanged();
    }

    public moveArea(area: Size, where: Direction) {
        // const offset = Off[where];

        // const moveCell = (x: number, y: number) => {
        //     const cellPos = Pos(x, y);
        //     const newPos = cellPos.mi(offset);
        //     const cell = this.grid.cells.get(cellPos);
        //     if (cell) {
        //         cell.rm();
        //         this.grid.loadCell(newPos, cell.type, cell.direction);
        //         this.cellPlaced(cellPos, null);
        //         this.cellPlaced(newPos, cell);
        //     }
        // };

        // switch (where) {
        //     case Direction.Right:
        //     case Direction.Up:
        //         for (let x = area.left + area.width - 1; x >= area.left; x--)
        //             for (let y = area.bottom + area.height - 1; y >= area.bottom; y--)
        //                 moveCell(x, y);
        //         break;
        //     case Direction.Left:
        //     case Direction.Down:
        //         for (let x = area.left; x < area.left + area.width; x++)
        //             for (let y = area.bottom; y < area.bottom + area.height; y++)
        //                 moveCell(x, y);
        //         break;
        // }

        // TODO: performance
        const offset = Off[where];
        const cloned = this.grid.cloneArea(area);
        this.clearArea(area);
        this.insertArea(area.pos.mi(offset), cloned, false);
    }

    // @ts-expect-error
    public cellPlaced(pos: Position, cell: Cell | null) {}
    public destroy() {}
}
