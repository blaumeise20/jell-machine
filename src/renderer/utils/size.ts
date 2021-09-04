import { Direction } from "../core/cell";
import { Off, Position } from "./positions";

export class Size {
    width: number;
    height: number;
    bottom: number;
    left: number;

    constructor(wh: number);
    constructor(width: number, height: number);
    constructor(width: number, height: number, bottom: number, left: number);
    constructor(wh: number, height?: number, bottom: number = 0, left: number = 0) {
        if (height == undefined) {
            this.width = wh;
            this.height = wh;
        }
        else {
            this.width = wh;
            this.height = height;
        }

        this.bottom = bottom;
        this.left = left;
    }

    contains(pos: Position) {
        if (this.width == 0 || this.height == 0) {
            return true;
        }
        return pos.x >= this.left &&
               pos.x <  this.left + this.width &&
               pos.y >= this.bottom &&
               pos.y <  this.bottom + this.height;
    }

    move(where: Direction) {
        const offset = Off[where];
        return new Size(this.width, this.height, this.bottom + offset.x, this.left + offset.y);
    }

    static from(p1: Position | null, p2: Position | null): Size | null {
        if (!p1 || !p2) return null;
        return new Size(Math.abs(p1.x - p2.x) + 1, Math.abs(p1.y - p2.y) + 1, Math.min(p1.y, p2.y), Math.min(p1.x, p2.x));;
    }
}
