import type { Position } from "../coord/positions";
import type { ItemIdentifier } from "../extensions";
import type { CellGrid } from "./grid";
import { Direction } from "../coord/direction";
import type { Cell, CellData } from "./cell";
import type { UpdateType } from "./cellUpdates";
import { Registry } from "@core/registry";


export class CellType {
    id!: ItemIdentifier;

    private constructor(public options: Readonly<CellTypeOptions>) { }

    public get data() {
        return this.options.data;
    }

    public get behavior() {
        return this.options.behavior;
    }

    // onFlip(fn: (cell: CellData, horizontal: boolean) => CellData) {
    //     this.options.flip = fn;
    //     return this;
    // }
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

    _newCell(grid: CellGrid, pos: Position, dir: Direction, generated: boolean) {
        return new this.behavior(pos, this, dir, grid, generated);
    }

    static create(id: ItemIdentifier, options: CellTypeOptions) {
        const t = new CellType(options);
        t.id = id;
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

export interface CellTypeOptions {
    behavior: typeof Cell;
    textureName: string;
    textureOverride?(cell: Cell): string;
    flip?(cell: CellData, horizontal: boolean): CellData;
    merge?(self: CellData, other: CellData): CellData;
    data?: any;
    updateType?: UpdateType;
    updateOrder?: number;
}
