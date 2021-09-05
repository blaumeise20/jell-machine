import { writable, Writable } from "svelte/store";
import { Size } from "../utils/size";
import { Off, Pos, Position, PosMap } from "../utils/positions";
import { base74Decode, base74Key, decodeBase74, encodeBase74, int } from "../utils/nums";
import { Tile } from "./tiles";
import { Cell, CellType, Direction } from "./cell";
import arr from "create-arr";
import { doStep } from "./cellUpdates";

export const openLevel: Writable<CellGrid | null> = writable(null);
// export const openLevel2: Writable<CellGrid | null> = writable(null);

// export const activeLevel: Writable<0 | 1 | 2> = writable(0);
// export const selectedGrid = derived(activeLevel, l => l == 0 ? null : l == 1 ? get(openLevel1) : get(openLevel2));

export enum LevelError {
    Unknown,
    VersionWrong,
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
            return this.cells.set(pos, type.newCell(this, pos, direction, !this.initial)), true;
        }
        return false;
    }

    /**
     * Heart of Jell Machine.
     */
    doStep() {
        this.initial = false;
        doStep(this);

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

    insert(selection: CellGrid, selectionPos: Position) {
        for (const cell of selection.cellList) {
            this.loadCell(cell.pos.mi(selectionPos), cell.type, cell.direction);
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
                if (this.cells.get(newPos)) cell.rm();
                cell.setPosition(newPos);
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
    //#endregion

    /**
     * Generates a string representation of the grid.
     */
    toString(format: "V3" = "V3") {
        // TODO: add infinite grid support
        if (this.isInfinite) throw new Error("oh no i'm infinite");

        let str = "";

        switch (format) {
            case "V3":
                str += `V3;${encodeBase74(this.size.width)};${encodeBase74(this.size.height)};`;

                // TODO: add correct compression

                const cellData = arr(this.size.width * this.size.height, 72);

                for (let y = 0; y < this.size.height; y++)
                    for (let x = 0; x < this.size.width; x++)
                        if (this.tiles.get(Pos(x, y)) == Tile.Placable)
                            cellData[x + (y * this.size.width)] = 73;

                for (const cell of this.cells.values())
                    cellData[cell.pos.x + (cell.pos.y * this.size.width)] += (2 * cell.type.data.v3id) + (18 * cell.direction) - 72;


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
    static loadFromString(code: string): [true, CellGrid] | [false, LevelError] {
        // we don't need whitespace
        // maybe people copy it with newlines before, that might break it
        code = code.trim();

        const parts = code.split(";");
        const grid = new CellGrid();
        try {
            // switch over level type
            switch (parts[0]) {
                case "V1": {
                    grid.size = new Size(int(parts[1]), int(parts[2]));

                    // placable stuff
                    const placables = parts[3].split(",");
                    if (placables[0]) {
                        for (const position of placables) {
                            const posArr = position.split(".");
                            const pos = Pos(int(posArr[0]), int(posArr[1]));
                            if (!grid.size.contains(pos)) return [false, LevelError.OutOfBounds];
                            grid.tiles.set(pos, Tile.Placable);
                        }
                    }

                    // actual cells
                    const cells = parts[4].split(",");
                    if (cells[0]) {
                        for (const cell of cells) {
                            const splitCell = cell.split(".");
                            const cellId = int(splitCell[0]);
                            if (!grid.loadCell(Pos(int(splitCell[2]), int(splitCell[3])), CellType.types.find(t => t.data?.v3id == cellId)!, int(splitCell[1]))) return [false, LevelError.OutOfBounds];
                        }
                    }

                    // naming stuff, can be put at the end of level codes
                    // optional to avoid errors when people forget to put ;; at the end
                    grid.description = parts[5]?.trim() || "";
                    grid.name = parts[6]?.trim() || "";
                } break;

                case "V3": {
                    grid.size = new Size(decodeBase74(parts[1]), decodeBase74(parts[2]));
                    if (parts[1][0] == "0") grid.isInfinite = true;

                    function setCell(cellContent: number, index: number) {
                        const pos = Pos(index % grid.size!.width, Math.floor(index / grid.size!.width));
                        if (cellContent % 2) {
                            if (!grid.size.contains(pos)) return 0;
                            grid.tiles.set(pos, Tile.Placable);
                        }
                        if (cellContent < 72) {
                            const cellId = Math.floor(cellContent / 2) % 9;
                            return grid.loadCell(pos, CellType.types.find(t => t.data?.v3id == cellId)!, Math.floor(cellContent / 18));
                        }
                        return true;
                    }

                    const cells = parts[3];
                    const cellArray = arr(grid.size.width * grid.size.height, 0);
                    let cellIndex = 0;
                    for (let i = 0; i < cells.length; i++) {
                        if (cells[i] == ")" || cells[i] == "(") {
                            let offset: number, repeatingLength: number;

                            // c = cells
                            // o = offset (cells length - 1)
                            // l = repeating length (cells length * (pattern count - 1))
                            // c)ol
                            // c(o)l
                            // c(o(l)

                            if (cells[i] == ")") {
                                offset = base74Decode[cells[++i]];
                                repeatingLength = base74Decode[cells[++i]];
                            }
                            else {
                                // cells[i] == "("

                                i++;
                                let str = "";
                                for (; cells[i] != ")" && cells[i] != "("; i++) str += cells[i];
                                offset = decodeBase74(str);

                                if (cells[i] == ")") {
                                    i++;
                                    repeatingLength = base74Decode[cells[i]];
                                }
                                else {
                                    i++;
                                    const str = cells.substring(i, cells.indexOf(")", i));
                                    i += str.length;
                                    repeatingLength = decodeBase74(str);
                                }
                            }

                            for (let j = 0; j < repeatingLength; j++) {
                                if (!setCell(cellArray[cellIndex - offset - 1], cellIndex)) return [false, LevelError.OutOfBounds];
                                cellArray[cellIndex] = cellArray[cellIndex - offset - 1];
                                cellIndex++;
                            }
                        }
                        else {
                            if (!setCell(base74Decode[cells[i]], cellIndex)) return [false, LevelError.OutOfBounds];
                            cellArray[cellIndex] = base74Decode[cells[i]];
                            cellIndex++;
                        }
                    }

                    // naming stuff, can be put at the end of level codes
                    // optional to avoid errors when people forget to put ;; at the end
                    grid.description = parts[4]?.trim() || "";
                    grid.name = parts[5]?.trim() || "";
                } break;

                // possibly wrong version
                // people might get the idea to change it to V4
                default: return [false, LevelError.VersionWrong];
            }
        }
        catch {
            // ERROR but we don't know the reason
            // maybe because V1 code's cell type is wrong or something is not an integer?
            return [false, LevelError.Unknown];
        }

        // everything worked
        return [true, grid];
    }
}
