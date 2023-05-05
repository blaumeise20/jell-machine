import { Direction } from "../direction";

/**
 * A `Map` for indexing with `Position`s.
 */
export class PosMap<T> {
    __object: Map<string, T> = new Map();

    constructor() {}

    clear(): void {
        this.__object.clear();
    }
    delete(key: Position): boolean {
        return this.__object.delete(`${key.x},${key.y}`);
    }
    forEach(callbackfn: (value: T, key: Position, map: PosMap<T>) => void, thisArg?: any): void {
        for (const [key, value] of this.__object) {
            callbackfn.call(thisArg, value, Pos(...(JSON.parse(`[${key}]`) as [number, number])), this);
        }
    }
    get(key: Position): T {
        return this.__object.get(`${key.x},${key.y}`)!;
    }
    getXY(x: number, y: number) {
        return this.__object.get(`${x},${y}`);
    }
    has(key: Position): boolean {
        return this.__object.has(`${key.x},${key.y}`);
    }
    set(key: Position, value: T): this {
        this.__object.set(`${key.x},${key.y}`, value);
        return this;
    }

    values(): IterableIterator<T> {
        return this.__object.values();
    }

    *entries(): IterableIterator<[Position, T]> {
        for (const [key, value] of this.__object)
            yield [Pos(...(JSON.parse(`[${key}]`) as [number, number])), value];
    }

    get size() {
        return this.__object.size;
    }
}

/**
 * Represents one coordinate point.
 */
export class Position {
    constructor(public readonly x: number, public readonly y: number) { }

    /**
     * Clones the current position by the specified offset.
     * @returns A new position moved by specified offset.
     */
    public mi(dir: Direction): this;
    public mi(offset: Position): this;
    public mi(offsetX: number, offsetY: number): this;
    public mi(offsetX: number | Position, offsetY?: number) {
        if (typeof offsetY == "number") {
            return new Position(this.x + (offsetX as number), this.y + offsetY);
        }
        else if (typeof offsetX == "number") {
            const off = Off[offsetX];
            return new Position(this.x + off.x, this.y + off.y);
        }
        else {
            return new Position(this.x + offsetX.x, this.y + offsetX.y);
        }
    }

    /**
     * Creates string representation of point.
     */
    public toString() {
        return this.x + "," + this.y;
    }

    /**
     * Formats the position to a human-readable string.
     */
    public format(digits: number = 3) {
        return `${this.x.toFixed(digits)} ${this.y.toFixed(digits)}`;
    }

    public equals(other: Position) {
        return this.x == other.x && this.y == other.y;
    }
}

/**
 * Shorthand for `new Position`.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns A `Position` object.
 */
export function Pos(x: number, y: number): Position { return new Position(x, y); }

/**
 * Turns an object with `x` and `y` properties into a `Position`.
 * @param obj Object with `x` and `y` properties.
 * @returns A `Position` object.
 */
export function toPos(obj: { x: number, y: number }): Position { return new Position(obj.x, obj.y); }

export const Off = {
    [Direction.Right]: Pos( 1,  0),
    [Direction.Down ]: Pos( 0, -1),
    [Direction.Left ]: Pos(-1,  0),
    [Direction.Up   ]: Pos( 0,  1),
} as Record<Direction | number, Position>;
