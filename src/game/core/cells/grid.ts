import { writable, Writable } from "svelte/store";
import { Size } from "../coord/size";
import { Off, Pos, Position, PosMap } from "../coord/positions";
import { Tile } from "../tiles";
import { Cell } from "./cell";
import { CellType } from "./cellType";
import { Extension } from "../extensions";
import { Direction } from "../coord/direction";

// yes i'm sorry so many casts
const context = (require as any).context("../../extensions", true, /\.ts$/) as any;
(context.keys() as string[]).forEach(key => Extension.load(key.substring(2, key.length - 3), context(key).load));

import { doStep } from "./cellUpdates";
import { Registry } from "../registry";
import { BorderMode } from "./border";
import { Events } from "@core/events";

export const openLevel: Writable<CellGrid | null> = writable(null);
export let grid: CellGrid | null = null;
openLevel.subscribe(g => grid = g);

openLevel.subscribe(o => (window as any).openLevel = o);

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
    currentSubtick = 0;
    selectedArea: Size | null = null;
    borderMode = BorderMode.Default;

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
            const cell = type._newCell(this, pos, direction % 4, !this.initial)
            this.cells.set(pos, cell);
            cell.init();
            return cell;
        }
        return false;
    }

    /**
     * Heart of Jell Machine.
     */
    doStep(subtick: boolean) {
        this.initial = false;
        Events.emit("tickstart");

        try { doStep(this, subtick); } catch {}

        this.tickCount++;
        Events.emit("tickend");
        this.reloadUI();
    }

    reset() {
        if (!this.initial) {
            this.cells.clear();
            for (let i = this.cellList.length; i--;) this.cellList[i].reset();
            this.initial = true;

            this.reloadUI();

            this.tickCount = 0;
            this.currentSubtick = 0;
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
    toString(format: string): string | false {
        // TODO: add infinite grid support
        if (this.isInfinite) throw new Error("oh no i'm infinite");


        const stringify = Registry.getLevelCode(format)?.exportFn;
        if (stringify) {
            try {
                const result = stringify(this);
                if (result) return result;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        }

        return false;
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
            const parse = Registry.getLevelCode(parts[0])?.importFn;
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
