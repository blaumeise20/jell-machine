import { writable, Writable } from "svelte/store";
import { Size } from "../utils/size";
import { Off, Pos, Position, PosMap } from "../utils/positions";
import { base74Key, encodeBase74 } from "../utils/nums";
import { Tile } from "./tiles";
import { Cell, CellType, Direction } from "./cell";
import { Extension } from "@core/extensions";

// yes i'm sorry so many casts
const context = (require as any).context("../extensions", true, /\.ts$/) as any;
(context.keys() as string[]).forEach(key => Extension.load(key.substring(2, key.length - 3), context(key).load));

import arr from "create-arr";
import { doStep } from "./cellUpdates";

export const openLevel: Writable<CellGrid | null> = writable(null);

openLevel.subscribe(o => (window as any).openLevel = o);
// export const openLevel2: Writable<CellGrid | null> = writable(null);

// export const activeLevel: Writable<0 | 1 | 2> = writable(0);
// export const selectedGrid = derived(activeLevel, l => l == 0 ? null : l == 1 ? get(openLevel1) : get(openLevel2));

export enum LevelError {
    Unknown,
    UnknownFormat,
    OutOfBounds
}
export class CellGrid {
    isInfinite: boolean = false;
    size!: Size;
    name: string = "";
    description: string = "";
    readonly tiles = new PosMap<Tile, Tile>(Tile.None);
    readonly cells = new PosMap<Cell, null>(null);
    readonly cellList: Cell[] = [];
    initial = true;
    tickCount = 0;
    selectedArea: Size | null = null;

    private constructor() {}

    /**
     * Loads a cell into the grid (creates a new cell).
     * @param pos Cell position.
     * @param type Cell type.
     * @param direction Rotation of the cell.
     */
    loadCell(pos: Position, type: CellType, direction: Direction) {
        if (this.isInfinite || this.size.contains(pos)) {
            this.cells.get(pos)?.rm();
            this.cells.set(pos, type._newCell(this, pos, direction, !this.initial));
            return true;
        }
        return false;
    }

    /**
     * Heart of Jell Machine.
     */
    doStep() {
        this.initial = false;
        Extension.extensions.forEach(e => e.emit("tickstart"));

        doStep(this);

        this.tickCount++;
        Extension.extensions.forEach(e => e.emit("tickend"));
        this.reloadUI();
    }

    reset() {
        if (!this.initial) {
            this.cells.clear();
            for (let i = this.cellList.length; i--;) this.cellList[i].reset();
            this.initial = true;

            this.reloadUI();
        }
    }

    private _reloaders: any[] = [];
    reloadUI(fn?: any) {
        if (fn) this._reloaders.push(fn);
        else this._reloaders.forEach(r => r());
    }

    //#region grid actions
    extract(area: Size, del = false) {
        const grid = new CellGrid();
        grid.size = new Size(area.width, area.height);
        for (let x = 0; x < area.width; x++) {
            for (let y = 0; y < area.height; y++) {
                const cell = this.cells.get(Pos(x + area.left, y + area.bottom));
                if (cell) {
                    grid.loadCell(Pos(x, y), cell.type, cell.direction);
                    if (del) cell.rm();
                }
            }
        }
        if (del) this.reloadUI();
        return grid;
    }

    insert(selection: CellGrid, selectionPos: Position, smartMerge: boolean) {
        for (const cell of selection.cellList) {
            const newPos = Pos(cell.pos.x + selectionPos.x, cell.pos.y + selectionPos.y);
            const cellAt = this.cells.get(newPos);
            if (cellAt && smartMerge) {
                const newData = cellAt.type.merge(cellAt, cell);
                this.loadCell(newPos, newData[0], newData[1]);
            }
            else this.loadCell(cell.pos.mi(selectionPos), cell.type, cell.direction);
        }
        this.reloadUI();
    }

    clear(area: Size) {
        for (let x = 0; x < area.width; x++) {
            for (let y = 0; y < area.height; y++) {
                const cell = this.cells.get(Pos(x + area.left, y + area.bottom));
                if (cell) cell.rm();
            }
        }
        this.reloadUI();
    }

    move(area: Size, where: Direction) {
        const offset = Off[where];

        const moveCell = (x: number, y: number) => {
            const cellPos = Pos(x, y);
            const newPos = cellPos.mi(offset);
            const cell = this.cells.get(cellPos);
            if (cell) {
                cell.rm();
                this.loadCell(newPos, cell.type, cell.direction);
            }
        };

        switch (where) {
            case Direction.Right:
                for (let x = area.left + area.width - 1; x >= area.left; x--)
                    for (let y = area.bottom + area.height - 1; y >= area.bottom; y--)
                        moveCell(x, y);
                break;
            case Direction.Down:
                for (let x = area.left; x < area.left + area.width; x++)
                    for (let y = area.bottom; y < area.bottom + area.height; y++)
                        moveCell(x, y);
                break;
            case Direction.Left:
                for (let x = area.left; x < area.left + area.width; x++)
                    for (let y = area.bottom; y < area.bottom + area.height; y++)
                        moveCell(x, y);
                break;
            case Direction.Up:
                for (let x = area.left + area.width - 1; x >= area.left; x--)
                    for (let y = area.bottom + area.height - 1; y >= area.bottom; y--)
                        moveCell(x, y);
                break;
        }

        this.reloadUI();
    }

    rotateCW() {
        const grid = CellGrid.createEmpty(this.size.height, this.size.width);

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                const cell = this.cells.get(Pos(x, y));
                if (cell) {
                    const newPos = Pos(y, this.size.width - x - 1);
                    grid.loadCell(newPos, cell.type, (cell.direction + 1) % 4);
                }
            }
        }

        return grid;
    }

    rotateCCW() {
        const grid = CellGrid.createEmpty(this.size.height, this.size.width);

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                const cell = this.cells.get(Pos(x, y));
                if (cell) {
                    const newPos = Pos(this.size.height - y - 1, x);
                    grid.loadCell(newPos, cell.type, (cell.direction + 3) % 4);
                }
            }
        }

        return grid;
    }

    flipHorizontal() {
        const grid = CellGrid.createEmpty(this.size.width, this.size.height);

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                const cell = this.cells.get(Pos(x, y));
                if (cell) {
                    const newPos = Pos(this.size.width - x - 1, y);
                    grid.loadCell(newPos, ...cell.type.flip(cell, true));
                }
            }
        }

        return grid;
    }

    flipVertical() {
        const grid = CellGrid.createEmpty(this.size.width, this.size.height);

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                const cell = this.cells.get(Pos(x, y));
                if (cell) {
                    const newPos = Pos(x, this.size.height - y - 1);
                    grid.loadCell(newPos, ...cell.type.flip(cell, false));
                }
            }
        }

        return grid;
    }

    fillCell(area: Size, type: CellType, direction: Direction) {
        let successful = true;
        loop: for (let x = 0; x < area.width; x++) {
            for (let y = 0; y < area.height; y++) {
                if (!this.loadCell(Pos(x + area.left, y + area.bottom), type, direction)) {
                    successful = false;
                    break loop;
                }
            }
        }
        this.reloadUI();
        return successful;
    }

    fillTile(area: Size, tile: Tile) {
        for (let x = 0; x < area.width; x++) {
            for (let y = 0; y < area.height; y++) {
                this.tiles.set(Pos(x + area.left, y + area.bottom), tile);
            }
        }
        this.reloadUI();
    }
    //#endregion

    /**
     * Generates a string representation of the grid.
     */
    toString(format: "V3" = "V3") {
        // TODO: add infinite grid support
        if (this.isInfinite) throw new Error("oh no i'm infinite");

        let str = "";

        switch (format) {
            // TODO: extract to core extension
            case "V3":
                str += `V3;${encodeBase74(this.size.width)};${encodeBase74(this.size.height)};`;

                // TODO: add correct compression

                const cellData = arr(this.size.width * this.size.height, 72);

                for (let y = 0; y < this.size.height; y++)
                    for (let x = 0; x < this.size.width; x++)
                        if (this.tiles.get(Pos(x, y)) == Tile.Placable)
                            cellData[x + (y * this.size.width)] = 73;

                for (const cell of this.cells.values()) {
                    const v3id = cell.type.data?.v3id;
                    if (v3id != null)
                        cellData[cell.pos.x + (cell.pos.y * this.size.width)] += (2 * cell.type.data.v3id) + (18 * cell.direction) - 72;
                }


                let runLength = 1;
                for (let i = 0; i < cellData.length; i++) {
                    if (i + 1 < cellData.length && cellData[i] == cellData[i + 1]) runLength++;
                    else {
                        if (runLength > 3) {
                            if (encodeBase74(runLength - 1).length > 1)
                                str += base74Key[cellData[i]] + "(0(" + encodeBase74(runLength - 1) + ")";
                            else
                                str += base74Key[cellData[i]] + ")0" + encodeBase74(runLength - 1);
                        }
                        else str += base74Key[cellData[i]].repeat(runLength);
                        runLength = 1;
                    }
                }

                str += `;${this.description.trim().replace(/;/g, ":")};${this.name.trim().replace(/;/g, ":")}`
        }

        return str;
    }

    /**
     * Creates a new empty infinite cell grid.
     * @returns A cell grid.
     */
    static createEmpty(width = 100, height = 100) {
        const grid = new CellGrid();
        grid.size = new Size(width, height);
        // grid.isInfinite = true;
        return grid;
    }

    /**
     * Loads a level (CellGrid) from the specified level code.
     * @param code The imported level code (mostly from clipboard).
     * @returns Either an error or the generated CellGrid.
     */
    static loadFromString(code: string): [true, CellGrid] | [false, LevelError, ...any[]] {
        // we don't need whitespace
        // maybe people copy it with newlines before, that might break it
        code = code.trim();

        const parts = code.split(";");
        const grid = new CellGrid();
        try {
            // level codes are registered by extensions
            const parse = Extension.levelCodes[parts[0]];
            if (parse) {
                const result = parse(parts, grid);
                if (result == null) return [true, grid];
                else return [false, LevelError.Unknown];
            }
            else {
                // people imported a level code that we don't support
                return [false, LevelError.UnknownFormat];
            }
        }
        catch (e) {
            // ERROR but we don't know the reason
            // maybe because V1 code's cell type is wrong or something is not an integer?
            return [false, LevelError.Unknown, e];
        }
    }
}
