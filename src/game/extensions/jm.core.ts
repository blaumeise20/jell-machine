import { ExtensionContext } from "@core/extensions";
import { Pos } from "@core/coord/positions";
import { Cell } from "@core/cells/cell";
import { UpdateType } from "@core/cells/cellUpdates";
import { Size } from "@core/coord/size";
import { base74Decode, decodeBase74, int } from "@utils/nums";
import { Tile } from "@core/tiles";
import arr from "create-arr";
import { LevelCode } from "@core/levelCode";
import { Direction } from "@core/coord/direction";

export function load(ctx: ExtensionContext) {
    const generator = ctx.createCellType("jm.core.generator", {
        behavior: class GeneratorCell extends Cell {
            update() {
                const source = this.getCellTo((this.direction + 2) % 4);
                if (!source) return;
                const [sourcePos, sourceDir] = source;

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
        data: { v3id: 0 },
        updateOrder: 1,
        updateType: UpdateType.Directional,
    });

    const mover = ctx.createCellType("jm.core.mover", {
        behavior: class MoverCell extends Cell {
            update() {
                super.push(this.direction, 1);
            }

            push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);

                if (dir == this.direction) return super.push(dir, bias + 1);
                if ((dir + 2) % 4 == this.direction) return super.push(dir, bias - 1);
                return super.push(dir, bias);
            }
        },
        textureName: "mover",
        data: { v3id: 3 },
        updateOrder: 3,
        updateType: UpdateType.Directional,
    });

    const cwRotator = ctx.createCellType("jm.core.cw_rotator", {
        behavior: class RotatorCell extends Cell {
            update() {
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
        data: { v3id: 1, rotation: 1 },
        flip: (options) => [ccwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });
    const ccwRotator = ctx.createCellType("jm.core.ccw_rotator", {
        behavior: cwRotator.behavior,
        textureName: "ccwRotator",
        data: { v3id: 2, rotation: -1 },
        flip: (options) => [cwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });

    const push = ctx.createCellType("jm.core.push", {
        behavior: Cell,
        textureName: "push",
        data: { v3id: 5 },
        flip: d => d,
    });

    const slide = ctx.createCellType("jm.core.slide", {
        behavior: class SlideCell extends Cell {
            push(dir: Direction, bias: number) {
                if (this.direction % 2 == dir % 2 || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "slide",
        data: { v3id: 4 },
        flip: d => d,
    });

    const arrow = ctx.createCellType("jm.core.arrow", {
        behavior: class ArrowCell extends Cell {
            push(dir: Direction, bias: number) {
                if (this.direction == dir || this.disabled) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "arrow",
    });

    const enemy = ctx.createCellType("jm.core.enemy", {
        behavior: class EnemyCell extends Cell {
            push(dir: Direction, bias: number) {
                // TODO: fix bug where enemies don't break when disabled before
                if (this.disabled) return super.push(dir, bias);
                this.rm();
                return null;
            }
        },
        textureName: "enemy",
        data: { v3id: 7 },
        flip: d => d,
    });

    const trash = ctx.createCellType("jm.core.trash", {
        behavior: class TrashCell extends Cell {
            push(dir: Direction, bias: number) {
                if (this.disabled) return super.push(dir, bias);
                return null;
            }
        },
        textureName: "trash",
        data: { v3id: 8 },
        flip: d => d,
    });

    const wall = ctx.createCellType("jm.core.wall", {
        behavior: class WallCell extends Cell {
            push() {
                return false;
            }

            rotate() {}
            setRotation() {}
            disable() {}
        },
        textureName: "wall",
        data: { v3id: 6 },
        flip: d => d,
    });

    const border = ctx.createCellType("_", {
        behavior: class BorderCell extends Cell {
            getPos() {
                return null;
            }
            push() {
                return false;
            }

            rotate() {}
            setRotation() {}
            disable() {}
        },
        textureName: "border",
        flip: d => d,
        merge: d => d,
    });

    ctx.addSlot(generator);
    ctx.addSlot(mover);
    ctx.addSlot(cwRotator, ccwRotator);
    ctx.addSlot(push, slide, arrow);
    ctx.addSlot(enemy);
    ctx.addSlot(trash);
    ctx.addSlot(wall, border);

    function findCell(id: number) {
        return Object.values(cells).find(t => t.data?.v3id == id);
    }

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
                const cellType = findCell(cellId);
                if (!cellType || !grid.loadCell(pos, cellType, int(splitCell[1]))) return false;
            }
        }

        // naming stuff, can be put at the end of level codes
        // optional to avoid errors when people forget to put ;; at the end
        grid.description = parts[5]?.trim() || "";
        grid.name = parts[6]?.trim() || "";
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
                    const cellType = findCell(cellId);
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
        });

    const cells = {
        generator,
        mover,
        cwRotator,
        ccwRotator,
        push,
        slide,
        arrow,
        enemy,
        trash,
        wall,
    }
    return cells;
}
