import type { Position } from "../coord/positions";
import type { CellGrid } from "./grid";
import type { Direction } from "../coord/direction";
import type { CellType } from "./cellType";

let cellid = 0;

export class Cell {
    public deleted = false;
    public disabledIn = -1;
    public get disabled(): boolean {
        return this.disabledIn == this.grid.tickCount;
    }
    public updatedIn = -1;
    public get updated(): boolean {
        return this.updatedIn == this.grid.tickCount;
    }
    id = cellid++;
    readonly initialPosition: Position;
    readonly initialDirection: Direction;

    constructor(public pos: Position, readonly type: CellType, public direction: Direction, readonly grid: CellGrid, readonly generated: boolean) {
        this.initialPosition = pos;
        this.initialDirection = direction;
        grid.cellList.push(this);
    }

    public get options(): CellData {
        return [this.type, this.direction];
    }

    rm() {
        if (this.deleted) return;
        this.grid.cells.delete(this.pos);
        if (this.generated || this.grid.initial) {
            const i = this.grid.cellList.indexOf(this);
            if (i >= 0) this.grid.cellList.splice(i, 1);
        }
        this.deleted = true;
    }

    update() {}

    reset() {
        if (this.generated) {
            const i = this.grid.cellList.indexOf(this);
            if (i >= 0) this.grid.cellList.splice(i, 1);
            this.deleted = true;
        }
        else {
            this.deleted = false;
            this.grid.cells.set(this.initialPosition, this);
            this.pos = this.initialPosition;
            this.direction = this.initialDirection;
        }

        this.disabledIn = -1;
        this.updatedIn = -1;
    }

    setPosition(pos: Position) {
        if (this.deleted) return;
        this.grid.cells.delete(this.pos);
        this.grid.cells.set(pos, this);
        this.pos = pos;
    }

    getCellTo(dir: Direction): Movement | null {
        const pos = this.pos.mi(dir);
        if (!this.grid.isInfinite && !this.grid.size.contains(pos)) return null;
        const cell = this.grid.cells.get(pos);
        if (!cell) return [pos, dir];
        return cell.getPos(dir);
    }

    getPos(dir: Direction): Movement | null {
        return [this.pos, dir];
    }

    push(dir: Direction, bias: number): PushResult {
        if (bias < 1) return false;

        const target = this.getCellTo(dir);
        if (!target) return false;

        const [pos, pushDir] = target;

        const tc = this.grid.cells.get(pos);
        if (tc == null) {
            this.setPosition(pos);
            if (dir != pushDir) this.direction = (this.direction + (pushDir - dir) + 4) % 4;
            return true;
        }

        const res = tc.push(pushDir, bias);
        if (res) {
            this.setPosition(pos);
            if (dir != pushDir) this.direction = (this.direction + (pushDir - dir) + 4) % 4;
            return true;
        }
        if (res === null) {
            this.rm();
            return true;
        }
        return false;
    }

    rotate(amount: number) {
        this.direction = ((this.direction + amount) % 4 + 4) % 4;
    }

    setRotation(amount: number) {
        this.direction = amount % 4;
    }

    disable() {
        this.disabledIn = this.grid.tickCount;
    }
}

export type PushResult = boolean | null;
export type Movement = [Position, Direction];

export type CellData = [CellType, Direction];
