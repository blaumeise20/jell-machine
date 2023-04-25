import type { Cell } from "./cell";
import type { CellType } from "./cellType";
import { Extension } from "../extensions";
import type { CellGrid } from "./grid";
import { Direction } from "../coord/direction";

const avgTime: number[] = [];

export function doStep(grid: CellGrid, _subtick: boolean) {
    if ((updateOrder as any).eee) {
        (updateOrder as any).eee = false;
        updateOrder.push(...Extension.getUpdateOrder());
    }

    for (const cell of grid.cells.__object.values()) {
        cell.oldPosition = cell.pos;
        cell.rotationOffset = 0;
    }

    const start = performance.now();
    for (const updateType of updateOrder) {
        switch (updateType[1]) {
            case UpdateType.Directional:
                for (const dir of directionalUpdateOrder) {
                    const cells: Cell[] = [];
                    let i = 0;
                    for (const cell of grid.updateTree.get(updateType[0])) {
                        if (cell.direction == dir) {
                            cells[i++] = cell;
                        }
                    }
                    cells.length = i;

                    switch (dir) {
                        case Direction.Right:
                            cells.sort((a, b) => b.pos.x - a.pos.x);
                            break;
                        case Direction.Down:
                            cells.sort((a, b) => a.pos.y - b.pos.y);
                            break;
                        case Direction.Left:
                            cells.sort((a, b) => a.pos.x - b.pos.x);
                            break;
                        case Direction.Up:
                            cells.sort((a, b) => b.pos.y - a.pos.y);
                            break;
                    }

                    for (let i = 0; i < cells.length; i++) {
                        const cell = cells[i];
                        if (!cell.deleted && !cell.disabled && !cell.updated) {
                            cell.update();
                            cell.updatedIn = grid.tickCount;
                        }
                    }
                }

                break;
            case UpdateType.Random:
                for (const cell of grid.cells.__object.values())
                    if (cell.type == updateType[0] && !cell.deleted && !cell.disabled && !cell.updated) {
                        cell.update();
                        cell.updatedIn = grid.tickCount;
                    }
                break;
        }
    }

    const duration = performance.now() - start;
    avgTime.push(duration);
    if (avgTime.length > 20) avgTime.shift();
    console.log("avg update time:", avgTime.reduce((a, b) => a + b, 0) / avgTime.length);
}

export enum UpdateType {
    Directional,
    Random,
}

export const directionalUpdateOrder = [
    Direction.Right,
    Direction.Left,
    Direction.Up,
    Direction.Down,
];

export const order = {
    [Direction.Right]: (cell: Cell) => -cell.pos.x,
    [Direction.Down]: (cell: Cell) => cell.pos.y,
    [Direction.Left]: (cell: Cell) => cell.pos.x,
    [Direction.Up]: (cell: Cell) => -cell.pos.y,
};

export const updateOrder: [CellType, UpdateType][] = Object.assign([], { eee: true });

export class UpdateTree {
    private cells: Map<CellType, Set<Cell>> = new Map();

    insert(cell: Cell) {
        if (!this.cells.has(cell.type)) {
            this.cells.set(cell.type, new Set());
        }

        this.cells.get(cell.type)!.add(cell);
    }

    delete(cell: Cell) {
        this.cells.get(cell.type)!.delete(cell);
    }

    get(type: CellType) {
        return this.cells.get(type)?.values() ?? [];
    }
}
