import type { Position } from "../coord/positions";
import type { ItemIdentifier } from "../extensions";
import type { CellGrid } from "./grid";
import { Direction } from "../coord/direction";
import type { Cell, CellData } from "./cell";
import type { UpdateType } from "./cellUpdates";
import { Registry } from "@core/registry";

export class CellType {
    id: ItemIdentifier;

    private constructor(public options: Readonly<CellTypeOptions>) {
        this.id = options.id;
    }

    public get data() {
        return this.options.data;
    }

    public get rawId() {
        return this.options.__rawId ?? this.id;
    }

    public get behavior() {
        return this.options.behavior;
    }

    flip(cell: Cell, horizontal: boolean): CellData {
        if (this.options.flip)
            return this.options.flip([cell.type, cell.direction], horizontal);
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
    merge(self: Cell, other: Cell) {
        if (this.options.merge)
            return this.options.merge(self.options, other.options);
        else
            return other.options;
    }

    getTex(cell: Cell) {
        if (this.options.textureOverride)
            return this.options.textureOverride(cell);
        else
            return this.options.textureName;
    }

    _newCell(grid: CellGrid, pos: Position, dir: Direction) {
        return new this.behavior(pos, this, dir, grid);
    }

    static create<B extends typeof Cell>(options: CellTypeOptions<B>) {
        const t = new CellType(options as any);
        Registry.registerCell(t);
        return t;
    }

    static flipOneWay = (data: CellData, horizontal: boolean) => {
        const [type, dir] = data;
        return [type, horizontal ?
            dir == Direction.Right ? Direction.Left
                : dir == Direction.Left ? Direction.Right : dir
            : dir == Direction.Up ? Direction.Down
                : dir == Direction.Down ? Direction.Up : dir
        ] as CellData;
    };
    static flipTwoWay = (data: CellData, horizontal: boolean) => {
        const horizontalTable = {
            [Direction.Right]: Direction.Down,
            [Direction.Down]: Direction.Right,
            [Direction.Left]: Direction.Up,
            [Direction.Up]: Direction.Left,
        };
        const verticalTable = {
            [Direction.Right]: Direction.Up,
            [Direction.Down]: Direction.Left,
            [Direction.Left]: Direction.Down,
            [Direction.Up]: Direction.Right,
        };
        const [type, dir] = data;
        return [type, horizontal ? horizontalTable[dir] : verticalTable[dir]] as CellData;
    };
}

export interface CellTypeOptions<B extends typeof Cell = typeof Cell, I = InstanceType<B>> {
    id: string;
    __rawId?: number;
    name: string;
    description?: string;
    behavior: B;
    textureName: string;
    textureOverride?(cell: I): string;
    flip?(cell: CellData, horizontal: boolean): CellData;
    merge?(self: CellData, other: CellData): CellData;
    data?: any;

    updateType?: UpdateType;
    updateOrder?: number;
    debugText?: (cell: I) => string;
    onRotate?: (cell: I, direction: Direction) => boolean;
    onDisable?: (cell: I) => boolean;
}
