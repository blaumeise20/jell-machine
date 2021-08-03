import { rotateBy } from "../utils/misc";
import { Off, Position } from "../utils/positions";
import { CellGrid } from "./grid";

let cellid = 0;

export class Cell {
    public deleted = false;
    id = cellid++;

    constructor(public pos: Position, readonly type: CellType, public direction: Direction, readonly grid: CellGrid) {
        grid.cellList.push(this);
    }

    rm(rmFromGrid = false) {
        if (this.deleted) return;
        const i = this.grid.cellList.indexOf(this);
        if (i >= 0) {
            this.grid.cellList.splice(i, 1);
            if (rmFromGrid) this.grid.cells.delete(this.pos);
            this.deleted = true;
        }
    }
    update() {}

    setPosition(pos: Position) {
        if (this.deleted) return;
        this.grid.cells.delete(this.pos);
        this.grid.cells.set(pos, this);
        this.pos = pos;
    }

    // WE HAVE BIAS TOO POG
    push(dir: Direction, bias: number): PushResult {
        if (bias < 1) return false;

        const target = this.pos.mi(Off[dir]);

        if (!this.grid.isInfinite && !this.grid.size.contains(target)) return false;

        const tc = this.grid.cells.get(target);
        if (tc == null) {
            this.setPosition(target);
            return true;
        }

        const res = tc.push(dir, bias);
        if (res) {
            this.setPosition(target);
            return true;
        }
        if (res === null) {
            this.rm(true);
            return true;
        }
        return false;
    }

    rotate(amount: number) {
        this.direction = rotateBy(this.direction, amount);
    }
}

export enum CellType {
    Generator = 0,
    Mover = 3,
    CWrotator = 1,
    CCWrotator = 2,
    Push = 5,
    Slide = 4,
    Enemy = 7,
    Trash = 8,
    Wall = 6
}

export const cellTypes = [
    [CellType.Generator, "generator"],
    [CellType.Mover, "mover"],
    [CellType.CWrotator, "cwRotator"],
    [CellType.CCWrotator, "ccwRotator"],
    [CellType.Push, "push"],
    [CellType.Slide, "slide"],
    [CellType.Enemy, "enemy"],
    [CellType.Trash, "trash"],
    [CellType.Wall, "wall"]
] as const;

export const cellMap = {
    [CellType.Generator]: "generator",
    [CellType.Mover]: "mover",
    [CellType.CWrotator]: "cwRotator",
    [CellType.CCWrotator]: "ccwRotator",
    [CellType.Push]: "push",
    [CellType.Slide]: "slide",
    [CellType.Enemy]: "enemy",
    [CellType.Trash]: "trash",
    [CellType.Wall]: "wall"
} as const;

export enum Direction {
    Right,
    Down,
    Left,
    Up
}

export type PushResult = boolean | null;
