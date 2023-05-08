import type { Cell } from "../cells/cell";
import { Extension } from "../extensions";
import type { CellGrid } from "./cellGrid";
import { Direction } from "../direction";
import { lazy } from "@utils/misc";

const avgTime: number[] = [];

const directionalUpdateOrder: [Direction, (a: Cell, b: Cell) => number][] = [
    [Direction.Right, (a, b) => b.pos.x - a.pos.x],
    [Direction.Left, (a, b) => a.pos.x - b.pos.x],
    [Direction.Up, (a, b) => b.pos.y - a.pos.y],
    [Direction.Down, (a, b) => a.pos.y - b.pos.y],
];

const updateOrder = lazy(() => Extension.getUpdateOrder());

export function doStep(grid: CellGrid, _subtick: boolean) {
    for (const cell of grid.cells.__object.values()) {
        cell.oldPosition = cell.pos;
        cell.rotationOffset = 0;
    }

    const start = performance.now();
    for (const updateType of updateOrder()) {
        if (updateType[1] == UpdateType.Directional) {
            for (const [dir, sorting] of directionalUpdateOrder) {
                const cells: Cell[] = [];
                let i = 0;
                for (const cell of grid.cellCollection.group_get(updateType[0])) {
                    if (cell.direction == dir) {
                        cells[i++] = cell;
                    }
                }
                cells.length = i;
                cells.sort(sorting);

                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];
                    if (!cell.deleted && !cell.disabled && !cell.updated) {
                        cell.update();
                        cell.updatedIn = grid.tickCount;
                    }
                }
            }
        }
        else {
            for (const cell of grid.cellCollection.group_get(updateType[0])) {
                if (cell.type == updateType[0] && !cell.deleted && !cell.disabled && !cell.updated) {
                    cell.update();
                    cell.updatedIn = grid.tickCount;
                }
            }
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
