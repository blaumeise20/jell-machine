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

    public get options(): CellData {
        return [this.type, this.direction];
    }

    rm() {
        if (this.deleted) return;
        const i = this.grid.cellList.indexOf(this);
        if (i >= 0) {
            this.grid.cellList.splice(i, 1);
            this.grid.cells.delete(this.pos);
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
            this.rm();
            return true;
        }
        return false;
    }

    rotate(amount: number) {
        this.direction = rotateBy(this.direction, amount);
    }
}

export enum Direction {
    Right,
    Down,
    Left,
    Up
}

export type PushResult = boolean | null;


export class CellType {
    static types: CellType[] = [];

    private constructor(public options: Readonly<CellTypeOptions>) {}

    public get data() {
        return this.options.data;
    }

    public get behavior() {
        return this.options.behavior;
    }

    flip(cell: Cell, horizontal: boolean): CellData {
        if (this.options.flip) return this.options.flip([cell.type, cell.direction], horizontal);
        else {
            return [
                cell.type,
                horizontal ?
                    cell.direction == Direction.Right ? Direction.Left
                        : cell.direction == Direction.Left ? Direction.Right : cell.direction
                    : cell.direction == Direction.Up ? Direction.Down
                        : cell.direction == Direction.Down ? Direction.Up : cell.direction
            ];
        }
    }

    newCell(grid: CellGrid, pos: Position, dir: Direction) {
        return new this.behavior(pos, this, dir, grid);
    }

    static create(options: CellTypeOptions) {
        const t = new CellType(options);
        CellType.types.push(t);
        return t;
    }
}

export interface CellTypeOptions {
    behavior: typeof Cell;
    textureName: string;
    flip?(cell: CellData, horizontal: boolean): CellData;
    data?: any;
}

export type CellData = [CellType, Direction];
