import { Pos } from "@core/coord/positions";
import { Cell } from "@core/cells/cell";
import { UpdateType } from "@core/cells/cellUpdates";
import { Size } from "@core/coord/size";
import { Tile } from "@core/tiles";
import arr from "create-arr";
import { LevelCode } from "@core/levelCode";
import { Direction } from "@core/coord/direction";
import { BorderMode } from "@core/cells/border";
import { CellType } from "@core/cells/cellType";
import { Slot } from "@core/slot";

export function load() {
    const generator = CellType.create("jm.core.generator", {
        behavior: class GeneratorCell extends Cell {
            override update() {
                const source = this.getCellTo((this.direction + 2) % 4);
                if (!source) return;
                const [sourcePos, _] = source;

                const sourceCell = this.grid.cells.get(sourcePos);
                if (!sourceCell) return;

                const target = this.getCellTo(this.direction);
                if (!target) return;
                const [targetPos, targetDir] = target;

                const targetCell = this.grid.cells.get(targetPos);
                if (targetCell) if (!targetCell.push(targetDir, 1)) return;

                this.grid.loadCell(targetPos, sourceCell.type, sourceCell.direction + targetDir - this.direction);
            }
        },
        textureName: "generator",
        updateOrder: 1,
        updateType: UpdateType.Directional,
    });

    const mover = CellType.create("jm.core.mover", {
        behavior: class MoverCell extends Cell {
            override update() {
                super.push(this.direction, 1);
            }

            override push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);

                if (dir == this.direction) return super.push(dir, bias + 1);
                if ((dir + 2) % 4 == this.direction) return super.push(dir, bias - 1);
                return super.push(dir, bias);
            }
        },
        textureName: "mover",
        updateOrder: 3,
        updateType: UpdateType.Directional,
    });

    const cwRotator = CellType.create("jm.core.cw_rotator", {
        behavior: class RotatorCell extends Cell {
            override update() {
                const rotation = this.type.data.rotation;

                const valRight = this.getCellTo(Direction.Right);
                if (valRight) this.grid.cells.get(valRight[0])?.rotate(rotation);
                const valDown = this.getCellTo(Direction.Down);
                if (valDown) this.grid.cells.get(valDown[0])?.rotate(rotation);
                const valLeft = this.getCellTo(Direction.Left);
                if (valLeft) this.grid.cells.get(valLeft[0])?.rotate(rotation);
                const valUp = this.getCellTo(Direction.Up);
                if (valUp) this.grid.cells.get(valUp[0])?.rotate(rotation);
            }
        },
        textureName: "cwRotator",
        data: { rotation: 1 },
        flip: (options) => [ccwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });
    const ccwRotator = CellType.create("jm.core.ccw_rotator", {
        behavior: cwRotator.behavior,
        textureName: "ccwRotator",
        data: { rotation: -1 },
        flip: (options) => [cwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });

    const push = CellType.create("jm.core.push", {
        behavior: Cell,
        textureName: "push",
        flip: d => d,
    });

    const slide = CellType.create("jm.core.slide", {
        behavior: class SlideCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.direction % 2 == dir % 2 || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "slide",
        flip: d => d,
    });

    const arrow = CellType.create("jm.core.arrow", {
        behavior: class ArrowCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.direction == dir || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "arrow",
    });

    const enemy = CellType.create("jm.core.enemy", {
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

    const trash = CellType.create("jm.core.trash", {
        behavior: class TrashCell extends Cell {
            override push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);
                return null;
            }
        },
        textureName: "trash",
        flip: d => d,
    });

    const wall = CellType.create("jm.core.wall", {
        behavior: class WallCell extends Cell {
            override push() {
                return false;
            }

            override rotate() {}
            override setRotation() {}
            override disable() {}
        },
        textureName: "wall",
        flip: d => d,
    });

    const border = CellType.create("_", {
        behavior: class BorderCell extends Cell {
            override getPos(dir: Direction) {
                if (this.grid.borderMode == BorderMode.Wrap) return this.getCellTo(dir);
                return null;
            }
            override push() {
                return false;
            }

            override rotate() {}
            override setRotation() {}
            override disable() {}
        },
        textureName: "border",
        flip: d => d,
        merge: d => d,
    });

    Slot.add(generator);
    Slot.add(mover);
    Slot.add(cwRotator, ccwRotator);
    Slot.add(push, slide, arrow);
    Slot.add(enemy);
    Slot.add(trash);
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

        // placable stuff
        const placables = parts[3].split(",");
        if (placables[0]) {
            for (const position of placables) {
                const posArr = position.split(".");
                const pos = Pos(int(posArr[0]), int(posArr[1]));
                if (!grid.size.contains(pos)) return false;
                grid.tiles.set(pos, Tile.Placable);
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
                        if (!setCell(cellArray[cellIndex - offset - 1], cellIndex)) return false;
                        cellArray[cellIndex] = cellArray[cellIndex - offset - 1];
                        cellIndex++;
                    }
                }
                else {
                    if (!setCell(base74Decode[cells[i]], cellIndex)) return false;
                    cellArray[cellIndex] = base74Decode[cells[i]];
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
            str += `V3;${encodeBase74(grid.size.width)};${encodeBase74(grid.size.height)};`;

            // TODO: add correct compression

            const cellData = arr(grid.size.width * grid.size.height, 72);

            for (let y = 0; y < grid.size.height; y++)
                for (let x = 0; x < grid.size.width; x++)
                    if (grid.tiles.get(Pos(x, y)) == Tile.Placable)
                        cellData[x + (y * grid.size.width)] = 73;

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
                        if (encodeBase74(runLength - 1).length > 1)
                            str += base74Key[cellData[i]] + "(0(" + encodeBase74(runLength - 1) + ")";
                        else
                            str += base74Key[cellData[i]] + ")0" + encodeBase74(runLength - 1);
                    }
                    else str += base74Key[cellData[i]].repeat(runLength);
                    runLength = 1;
                }
            }

            str += `;${grid.description.trim().replace(/;/g, ":")};${grid.name.trim().replace(/;/g, ":")};${grid.borderMode}`;
            return str;
        });
}

const base74Key = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!$%&+-.=?^{}";
const base74Decode = {} as Record<string, number>;
for (let i = 0; i < base74Key.length; i++) base74Decode[base74Key[i]] = i;
const base = 74;

function int(x: string) {
    const parsed = parseInt(x);
    if (Number.isNaN(parsed)) throw new Error("");
    return parsed;
}

function decodeBase74(str: string) {
    let num = 0;
    for (const key of str) {
        num = num * base + (base74Decode[key])
        if (isNaN(num)) throw new Error("Invalid input string");
    };
    return num;
}

function encodeBase74(num: number) {
    if (num == 0) return "0";
    const arr: number[] = [];
    while (num != 0) {
        arr.unshift(num % base);
        num = Math.floor(num / base);
    }
    return arr.map(n => base74Key[n]).join("");
}
