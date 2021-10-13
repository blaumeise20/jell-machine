import { Position } from "../utils/positions";
import { Cell, CellType, Direction } from "./cell";
import { Extension } from "./extensions";
import { CellGrid } from "./grid";

export function doStep(grid: CellGrid) {
    if ((updateOrder as any).eee) {
        (updateOrder as any).eee = false;
        updateOrder.push(...Extension.getUpdateOrder());
    }

    console.time("update");
    for (const updateType of updateOrder) {
        switch (updateType[1]) {
            case UpdateType.Directional:
                for (const dir of directionalUpdateOrder) {
                    // linked list
                    let cells: ListNode<Cell> = null;
                    for (const cell of grid.cellList) {
                        if (cell.type == updateType[0] && cell.direction == dir) {
                            const cellPosition = order[dir](cell.pos);

                            if (cells == null) cells = { e: cell, o: cellPosition, n: null };
                            else {
                                let p: ListNode<Cell> = null as any;
                                let c: ListNode<Cell> = cells as any;

                                while (c != null && c.o < cellPosition) {
                                    p = c;
                                    c = c.n;
                                }

                                if (p) p.n = { e: cell, o: cellPosition, n: c };
                                else cells = { e: cell, o: cellPosition, n: c };
                            }
                        }
                    }

                    while (cells) {
                        if (!cells.e.deleted && !cells.e.disabled && !cells.e.updated) {
                            cells.e.update();
                            cells.e.updatedIn = grid.tickCount;
                        }
                        cells = cells.n;
                    }
                }

                break;
            case UpdateType.Random:
                for (const cell of grid.cellList)
                    if (cell.type == updateType[0] && !cell.deleted && !cell.disabled)
                        cell.update();
                break;
        }
    }
    console.timeEnd("update");
}

export enum UpdateType {
    Directional,
    Random
}

export const directionalUpdateOrder = [
    Direction.Right,
    Direction.Left,
    Direction.Up,
    Direction.Down,
];

export const order = {
    [Direction.Right]: (pos: Position) => -pos.x,
    [Direction.Down]: (pos: Position) => pos.y,
    [Direction.Left]: (pos: Position) => pos.x,
    [Direction.Up]: (pos: Position) => -pos.y,
};

export const updateOrder: [CellType, UpdateType][] = Object.assign([], { eee: true });

export type ListNode<T> = {
    e: T,
    o: number,
    n: ListNode<T>,
} | null;
