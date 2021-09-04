import { Direction } from "../core/cell";

/**
 * A `Map` for indexing with `Position`s.
 */
export class PosMap<T, X = undefined> extends Map<Position, T> {
    constructor(private getDefault?: X) {
        super();
    }

    delete(key: Position): boolean {
        return super.delete(key.toString() as any);
    }
    forEach(callbackfn: (value: T, key: Position, map: PosMap<T>) => void, thisArg?: any): void {
        super.forEach(function (value, key, map) {
            callbackfn.call(this, value, key, map);
        }, thisArg);
    }
    // @ts-ignore
    get(key: Position): T | X {
        const val = super.get(key.toString() as any);
        // @ts-ignore
        if (val === undefined) return this.getDefault;
        return val;
    }
    has(key: Position): boolean {
        return super.has(key.toString() as any);
    }
    set(key: Position, value: T | X): this {
        if (value === this.getDefault) super.delete(key);
        else super.set(key.toString() as any, value as any);
        return this;
    }

    *entries(): IterableIterator<[Position, T]> {
        for (const [key, value] of super.entries()) {
            yield [Pos(...(JSON.parse(`[${key}]`) as [number, number])), value];
        }
    }
}

/**
 * Represents one coordinate point.
 */
export class Position {
    constructor(public x: number, public y: number) { }

    /**
     * Moves the current position by a specified offset.
     * @param offsetX
     * @param offsetY
     * @returns Itself
     */
    move(offset: Position): this;
    move(offsetX: number, offsetY: number): this;
    move(offsetX: number | Position, offsetY?: number) {
        if (typeof offsetX == "number") {
            this.x += offsetX;
            this.y += offsetY!;
        }
        else {
            this.x += offsetX.x,
            this.y += offsetX.x;
        }
        return this;
    }
    /**
     * Clones the current position by the specified offset.
     * @param offsetX
     * @param offsetY
     * @returns A new position moved by specified offset.
     */
    mi(offset: Position): this;
    mi(offsetX: number, offsetY: number): this;
    mi(offsetX: number | Position, offsetY?: number) {
        if (typeof offsetX == "number") {
            return new Position(this.x + offsetX, this.y + offsetY!);
        }
        else {
            return new Position(this.x + offsetX.x, this.y + offsetX.y);
        }
    }

    /**
     * Clones the current point.
     * @returns New position.
     */
    c() {
        return new Position(this.x, this.y);
    }

    /**
     * Creates string representation of point.
     */
    toString() {
        return this.x + "," + this.y;
    }
}

/**
 * Shorthand for `new Position`.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @returns A `Position` object.
 */
export const Pos = (x: number, y: number) => new Position(x, y);
export const Off = {
    [Direction.Right]: Pos( 1,  0),
    [Direction.Down ]: Pos( 0, -1),
    [Direction.Left ]: Pos(-1,  0),
    [Direction.Up   ]: Pos( 0,  1),
} as Record<Direction | number, Position>;
