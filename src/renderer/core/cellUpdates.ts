import { Position } from "../utils/positions";
import { CellType, Direction } from "./cell";
import { CellGrid } from "./grid";

export function doStep(grid: CellGrid) {
    // TODO: add all cells

    for (const updateType of updateOrder) {
        console.log(updateType);
        console.time("something");
        switch (updateType[1]) {
            case UpdateType.Directional:
                for (const dir of directionalUpdateOrder) {
                    grid.cellList
                        .filter(c => c.type == updateType[0] && c.direction == dir)
                        .orderBy(c => orderFn(c.pos, dir))
                        .forEach(c => c.update());
                }

                break;
            case UpdateType.Random:
                grid.cellList
                    .filter(c => c.type == updateType[0])
                    .forEach(c => c.update());
                break;
        }
        console.timeEnd("something");
    }
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

export function orderFn(pos: Position, dir: Direction) {
    switch (dir) {
        case Direction.Right: return -pos.x;
        case Direction.Down: return pos.y;
        case Direction.Left: return pos.x;
        case Direction.Up: return -pos.y;
    }
}

export const updateOrder: [CellType, UpdateType][] = [
    [CellType.Generator, UpdateType.Directional],
    [CellType.CWrotator, UpdateType.Random],
    [CellType.CCWrotator, UpdateType.Random],
    [CellType.Mover, UpdateType.Directional],
]
