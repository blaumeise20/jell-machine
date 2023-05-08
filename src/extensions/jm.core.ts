import { Pos } from "@core/coord/positions";
import { Cell } from "@core/cells/cell";
import { UpdateType } from "@core/grid/cellUpdates";
import { Size } from "@core/coord/size";
import { Tile } from "@core/tiles";
import arr from "create-arr";
import { LevelCode } from "@core/saving/levelCode";
import { Direction } from "@core/cells/direction";
import { BorderMode } from "@core/grid/border";
import { CellType } from "@core/cells/cellType";
import { Slot } from "@core/slot";
import { makeNumberEncoder } from "@core/numbers";

export function load() {
    const generator = CellType.create({
        id: "jm.core.generator",
        __rawId: 0,
        name: "Generator",
        description: "Generates the cell behind to the front.",
        behavior: class GeneratorCell extends Cell {
            override update() {
                const source = this.getCellTo((this.direction + 2) & 3);
                if (!source) return;
                const [sourcePos, _] = source;

                const sourceCell = this.grid.cells.get(sourcePos);
                if (!sourceCell) return;

                const target = this.getCellTo(this.direction);
                if (!target) return;
                const [targetPos, targetDir] = target;

                const targetCell = this.grid.cells.get(targetPos);
                if (targetCell) if (!targetCell.push(targetDir, 1)) return;

                const cell = this.grid.loadCell(targetPos, sourceCell.type, sourceCell.direction + targetDir - this.direction);
                if (cell) cell.oldPosition = this.pos;
            }
        },
        textureName: "generator",

        updateOrder: 1,
        updateType: UpdateType.Directional,
    });

    const mover = CellType.create({
        id: "jm.core.mover",
        __rawId: 1,
        name: "Mover",
        description: "Moves forward one cell and pushes all cells in the way.",
        behavior: class MoverCell extends Cell {
            override update() {
                super.push(this.direction, 1);
            }

            override push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);

                if (dir == this.direction) return super.push(dir, bias + 1);
                if (((dir + 2) & 3) == this.direction) return super.push(dir, bias - 1);
                return super.push(dir, bias);
            }
        },
        textureName: "mover",

        updateOrder: 3,
        updateType: UpdateType.Directional,
    });

    class RotatorCell extends Cell {
        override update() {
            const rotation = this.type.data.rotation;

            const valRight = this.getCellTo(Direction.Right);
            if (valRight) this.grid.rotate(valRight[0], rotation);
            const valDown = this.getCellTo(Direction.Down);
            if (valDown) this.grid.rotate(valDown[0], rotation);
            const valLeft = this.getCellTo(Direction.Left);
            if (valLeft) this.grid.rotate(valLeft[0], rotation);
            const valUp = this.getCellTo(Direction.Up);
            if (valUp) this.grid.rotate(valUp[0], rotation);
        }
    }
    // stupid typescript
    const cwRotator: CellType = CellType.create({
        id: "jm.core.cw_rotator",
        __rawId: 2,
        name: "Clockwise Rotator",
        description: "Rotates all four touching cells clockwise.",
        behavior: RotatorCell,
        textureName: "cwRotator",
        data: { rotation: 1 },
        flip: (options) => [ccwRotator, options[1]],

        updateOrder: 2,
        updateType: UpdateType.Random,
    });
    const ccwRotator: CellType = CellType.create({
        id: "jm.core.ccw_rotator",
        __rawId: 3,
        name: "Counterclockwise Rotator",
        description: "Rotates all four touching cells counterclockwise.",
        behavior: RotatorCell,
        textureName: "ccwRotator",
        data: { rotation: -1 },
        flip: (options) => [cwRotator, options[1]],

        updateOrder: 2,
        updateType: UpdateType.Random,
    });

    const push = CellType.create({
        id: "jm.core.push",
        __rawId: 4,
        name: "Push",
        description: "A simple cell that does nothing. Can be pushed in all directions.",
        behavior: Cell,
        textureName: "push",
        flip: d => d,
    });

    const slide = CellType.create({
        id: "jm.core.slide",
        __rawId: 5,
        name: "Slide",
        description: "A cell that can only be pushed in two directions.",
        behavior: class SlideCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.direction % 2 == dir % 2 || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "slide",
        flip: d => d,
    });

    const arrow = CellType.create({
        id: "jm.core.arrow",
        __rawId: 6,
        name: "Arrow",
        description: "A cell that can only be pushed in one direction.",
        behavior: class ArrowCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.direction == dir || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "arrow",
    });

    const enemy = CellType.create({
        id: "jm.core.enemy",
        __rawId: 7,
        name: "Enemy",
        description: "When pushed, destroys the pushing cell and dies itself. Used in levels and vaults.",
        behavior: class EnemyCell extends Cell {
            override push(dir: Direction, bias: number) {
                // TODO: fix bug where enemies don't break when disabled before
                if (this.disabled) return super.push(dir, bias);
                this.rm();
                return null;
            }
        },
        textureName: "enemy",
        flip: d => d,
    });

    const trash = CellType.create({
        id: "jm.core.trash",
        __rawId: 8,
        name: "Trash",
        description: "Deletes all incoming cells. Does not die itself.",
        behavior: class TrashCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);
                return null;
            }
        },
        textureName: "trash",
        flip: d => d,
    });

    const wall = CellType.create({
        id: "jm.core.wall",
        __rawId: 9,
        name: "Wall",
        description: "Can't be pushed nor rotated",
        behavior: class WallCell extends Cell {
            override push() {
                return false;
            }
        },
        textureName: "wall",
        flip: d => d,

        onRotate: () => false,
        onDisable: () => false,
    });

    const border = CellType.create({
        id: "_",
        name: "Border",
        description: "Behaves like the border of the grid. Can't be pushed nor rotated.",
        behavior: class BorderCell extends Cell {
            override getPos(dir: Direction) {
                if (this.grid.borderMode == BorderMode.Wrap) return this.getCellTo(dir);
                return null;
            }
            override push() {
                return false;
            }
        },
        textureName: "border",
        flip: d => d,
        merge: d => d,

        onRotate: () => false,
        onDisable: () => false,
    });
    CellType.create({
        id: "?",
        name: "Unknown",
        description: "Unknown cell type. Used when importing codes that contain cells that don't exist in this version of Jell Machine",
        behavior: Cell,
        textureName: "unknown",
        flip: d => d,
    });

    Slot.add(generator);
    Slot.add(mover);
    Slot.add(cwRotator, ccwRotator);
    Slot.add(push, slide, arrow);
    Slot.add(enemy, trash);
    Slot.add(wall, border);

    const v3Cells = [
        generator,
        cwRotator,
        ccwRotator,
        mover,
        slide,
        push,
        wall,
        enemy,
        trash,
    ];

    LevelCode.create("V1").import((parts, grid) => {
        grid.size = new Size(int(parts[1]), int(parts[2]));

        // placeable stuff
        const placeables = parts[3].split(",");
        if (placeables[0]) {
            for (const position of placeables) {
                const posArr = position.split(".");
                const pos = Pos(int(posArr[0]), int(posArr[1]));
                if (!grid.size.contains(pos)) return false;
                grid.tiles.set(pos, Tile.Placeable);
            }
        }

        // actual cells
        const cells = parts[4].split(",");
        if (cells[0]) {
            for (const cell of cells) {
                const splitCell = cell.split(".");
                const cellId = int(splitCell[0]);
                const pos = Pos(int(splitCell[2]), int(splitCell[3]));
                const cellType = v3Cells[cellId];
                if (!cellType || !grid.loadCell(pos, cellType, int(splitCell[1]))) return false;
            }
        }

        // naming stuff, can be put at the end of level codes
        // optional to avoid errors when people forget to put ;; at the end
        grid.description = parts[5]?.trim() || "";
        grid.name = parts[6]?.trim() || "";
        return true;
    });

    LevelCode.create("V3")
        .import((parts, grid) => {
            grid.size = new Size(decodeV3Num(parts[1]), decodeV3Num(parts[2]));

            if (parts[1][0] == "0") grid.isInfinite = true;

            function setCell(cellContent: number, index: number) {
                const pos = Pos(index % grid.size!.width, Math.floor(index / grid.size!.width));
                if (cellContent % 2) {
                    if (!grid.size.contains(pos)) return 0;
                    grid.tiles.set(pos, Tile.Placeable);
                }
                if (cellContent < 72) {
                    const cellId = Math.floor(cellContent / 2) % 9;
                    const cellType = v3Cells[cellId];
                    return cellType && grid.loadCell(pos, cellType, Math.floor(cellContent / 18));
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
                        offset = decodeV3Num(cells[++i]);
                        repeatingLength = decodeV3Num(cells[++i]);
                    }
                    else {
                        // cells[i] == "("

                        i++;
                        let str = "";
                        for (; cells[i] != ")" && cells[i] != "("; i++) str += cells[i];
                        offset = decodeV3Num(str);

                        if (cells[i] == ")") {
                            i++;
                            repeatingLength = decodeV3Num(cells[i]);
                        }
                        else {
                            i++;
                            const str = cells.substring(i, cells.indexOf(")", i));
                            i += str.length;
                            repeatingLength = decodeV3Num(str);
                        }
                    }

                    for (let j = 0; j < repeatingLength; j++) {
                        if (!setCell(cellArray[cellIndex - offset - 1], cellIndex)) return false;
                        cellArray[cellIndex] = cellArray[cellIndex - offset - 1];
                        cellIndex++;
                    }
                }
                else {
                    if (!setCell(decodeV3Num(cells[i]), cellIndex)) return false;
                    cellArray[cellIndex] = decodeV3Num(cells[i]);
                    cellIndex++;
                }
            }

            grid.description = parts[4]?.trim() || "";
            grid.name = parts[5]?.trim() || "";
            grid.borderMode = parseInt(parts[6]?.trim()) || 0;
            grid.borderMode = grid.borderMode >= 0 && grid.borderMode <= 2 ? grid.borderMode : 0;
            return true;
        })
        .export(grid => {
            let str = "";
            str += `V3;${encodeV3Num(grid.size.width)};${encodeV3Num(grid.size.height)};`;

            // TODO: add correct compression?

            const cellData = arr<number>(grid.size.width * grid.size.height, i => {
                if (grid.tiles.get(Pos(i % grid.size.width, Math.floor(i / grid.size.width)))) return 73;
                return 72;
            });

            for (const cell of grid.cells.values()) {
                const v3id = v3Cells.indexOf(cell.type);
                if (v3id != -1)
                    cellData[cell.pos.x + (cell.pos.y * grid.size.width)] += (2 * v3id) + (18 * cell.direction) - 72;
            }


            let runLength = 1;
            for (let i = 0; i < cellData.length; i++) {
                if (i + 1 < cellData.length && cellData[i] == cellData[i + 1]) runLength++;
                else {
                    if (runLength > 3) {
                        let num = encodeV3Num(runLength - 1);
                        if (num.length > 1)
                            str += encodeV3Num(cellData[i]) + "(0(" + encodeV3Num(runLength - 1) + ")";
                        else
                            str += encodeV3Num(cellData[i]) + ")0" + encodeV3Num(runLength - 1);
                    }
                    else str += encodeV3Num(cellData[i]).repeat(runLength);
                    runLength = 1;
                }
            }

            str += `;${grid.description.trim().replace(/;/g, ":")};${grid.name.trim().replace(/;/g, ":")};${grid.borderMode}`;
            return str;
        });
}

const codeV3 = makeNumberEncoder("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!$%&+-.=?^{}");
const decodeV3Num = codeV3.decode;
const encodeV3Num = codeV3.encode;

function int(x: string) {
    const parsed = parseInt(x);
    if (Number.isNaN(parsed)) throw new Error("");
    return parsed;
}
