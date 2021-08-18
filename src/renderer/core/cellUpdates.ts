import { Position } from "../utils/positions";
import { Cell, CellType, Direction } from "./cell";
import { CellGrid } from "./grid";

export function doStep(grid: CellGrid) {
    // TODO: add all cells

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
                        cells.e.update();
                        cells = cells.n;
                    }
                }

                break;
            case UpdateType.Random:
                for (const cell of grid.cellList) if (cell.type == updateType[0]) cell.update();
                // grid.cellList
                //     .filter(c => c.type == updateType[0])
                //     .forEach(c => c.update());
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
]

export const order = {
    [Direction.Right]: (pos: Position) => -pos.x,
    [Direction.Down]: (pos: Position) => pos.y,
    [Direction.Left]: (pos: Position) => pos.x,
    [Direction.Up]: (pos: Position) => -pos.y,
}

export const updateOrder: [CellType, UpdateType][] = [
    [CellType.Generator, UpdateType.Directional],
    [CellType.CWrotator, UpdateType.Random],
    [CellType.CCWrotator, UpdateType.Random],
    [CellType.Mover, UpdateType.Directional],
]


export type ListNode<T> = {
    e: T,
    o: number,
    n: ListNode<T>,
} | null;
