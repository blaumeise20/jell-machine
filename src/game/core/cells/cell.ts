import { Pos, Position } from "../coord/positions";
import type { CellGrid } from "./grid";
import { Direction } from "../coord/direction";
import type { CellType } from "./cellType";
import { BorderMode } from "./border";

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

    constructor(public pos: Position, readonly type: CellType, public direction: Direction, readonly grid: CellGrid) {}

    public get options(): CellData {
        return [this.type, this.direction];
    }

    init() {}
    update() {}
    delete() {}
    debugText() { return ""; }

    rm() {
        if (this.deleted) return;
        this.grid.cells.delete(this.pos);
        this.delete();
        this.deleted = true;
    }

    setPosition(pos: Position) {
        this.grid.cells.delete(this.pos);
        this.grid.cells.set(pos, this);
        this.pos = pos;
    }

    getCellTo(dir: Direction): Movement | null {
        const pos = this.pos.mi(dir);
        if (!this.grid.isInfinite && !this.grid.size.contains(pos)) {
            if (this.grid.borderMode == BorderMode.Wrap) {
                switch (dir) {
                    case Direction.Right:
                        return [Pos(0, pos.y), dir];
                    case Direction.Up:
                        return [Pos(pos.x, this.grid.size.height - 1), dir];
                    case Direction.Left:
                        return [Pos(this.grid.size.width - 1, pos.y), dir];
                    case Direction.Down:
                        return [Pos(pos.x, 0), dir];
                }
            }
            return null;
        }
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
        if (!target) {
            if (this.grid.borderMode == BorderMode.Delete) {
                this.rm();
                return true;
            }
            else return false;
        }

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
