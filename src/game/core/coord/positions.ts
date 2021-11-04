import { Direction } from "./direction";

/**
 * A `Map` for indexing with `Position`s.
 */
export class PosMap<T, X = undefined> {
    private store: Record<string, T> = {};

    constructor(private getDefault?: X) {}

    clear(): void {
        this.store = {};
    }
    delete(key: Position): boolean {
        return delete this.store[`${key.x},${key.y}`];
    }
    forEach(callbackfn: (value: T, key: Position, map: PosMap<T, X>) => void, thisArg?: any): void {
        for (const [key, value] of Object.entries(this.store)) {
            callbackfn.call(thisArg, value, Pos(...(JSON.parse(`[${key}]`) as [number, number])), this);
        }
    }
    get(key: Position): T | X {
        const val = this.store[`${key.x},${key.y}`];
        // @ts-ignore
        if (val === undefined) return this.getDefault;
        return val;
    }
    has(key: Position): boolean {
        return this.store[`${key.x},${key.y}`] !== undefined;
    }
    set(key: Position, value: T | X): this {
        if (value === this.getDefault) delete this.store[`${key.x},${key.y}`];
        else this.store[`${key.x},${key.y}`] = value as any;
        return this;
    }

    *values(): IterableIterator<T> {
        for (const value of Object.values(this.store))
            yield value;
    }

    *entries(): IterableIterator<[Position, T]> {
        for (const [key, value] of Object.entries(this.store))
            yield [Pos(...(JSON.parse(`[${key}]`) as [number, number])), value];
    }

    get size() {
        return Object.values(this.store).length;
    }
}

/**
 * Represents one coordinate point.
 */
export class Position {
    constructor(public x: number, public y: number) { }

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
     * Clones the current point.
     * @returns New position.
     */
    public c() {
        return new Position(this.x, this.y);
    }

    /**
     * Creates string representation of point.
     */
    public toString() {
        return this.x + "," + this.y;
    }
}

/**
 * Shorthand for `new Position`.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns A `Position` object.
 */
export function Pos(x: number, y: number): Position { return new Position(x, y); }
export const Off = {
    [Direction.Right]: Pos( 1,  0),
    [Direction.Down ]: Pos( 0, -1),
    [Direction.Left ]: Pos(-1,  0),
    [Direction.Up   ]: Pos( 0,  1),
} as Record<Direction | number, Position>;
