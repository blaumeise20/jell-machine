import { ExtensionContext } from "@core/extensions";
import { Off, Pos } from "@utils/positions";
import { Cell, Direction } from "@core/cell";
import { UpdateType } from "@core/cellUpdates";
import { Size } from "@utils/size";
import { base74Decode, decodeBase74, int } from "@utils/nums";
import { Tile } from "@core/tiles";
import arr from "create-arr";

export function load(ctx: ExtensionContext) {
    const generator = ctx.createCellType({
        behavior: class GeneratorCell extends Cell {
            update() {
                const source = this.pos.mi(Off[(this.direction + 2) % 4]);

                const sourceCell = this.grid.cells.get(source);
                if (!sourceCell) return;

                const target = this.pos.mi(Off[this.direction]);
                if (!this.grid.size.contains(target)) return;

                const targetCell = this.grid.cells.get(target);
                if (targetCell) if (!targetCell.push(this.direction, 1)) return;

                this.grid.loadCell(target, sourceCell.type, sourceCell.direction);
            }
        },
        textureName: "generator",
        data: { v3id: 0 },
        updateOrder: 1,
        updateType: UpdateType.Directional,
    });

    const mover = ctx.createCellType({
        behavior: class MoverCell extends Cell {
            update() {
                super.push(this.direction, 1);
            }

            push(dir: Direction, bias: number) {
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

    const cwRotator = ctx.createCellType({
        behavior: class RotatorCell extends Cell {
            update() {
                const rotation = this.type.data.rotation;

                this.grid.cells.get(this.pos.mi(Off[Direction.Right]))?.rotate(rotation);
                this.grid.cells.get(this.pos.mi(Off[Direction.Down]))?.rotate(rotation);
                this.grid.cells.get(this.pos.mi(Off[Direction.Left]))?.rotate(rotation);
                this.grid.cells.get(this.pos.mi(Off[Direction.Up]))?.rotate(rotation);
            }
        },
        textureName: "cwRotator",
        data: { v3id: 1, rotation: 1 },
        flip: (options) => [ccwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });
    const ccwRotator = ctx.createCellType({
        behavior: cwRotator.behavior,
        textureName: "ccwRotator",
        data: { v3id: 2, rotation: -1 },
        flip: (options) => [cwRotator, options[1]],
        updateOrder: 2,
        updateType: UpdateType.Random,
    });

    const push = ctx.createCellType({
        behavior: Cell,
        textureName: "push",
        data: { v3id: 5 },
        flip: d => d,
    });

    const slide = ctx.createCellType({
        behavior: class SlideCell extends Cell {
            push(dir: Direction, bias: number) {
                if (this.direction % 2 == dir % 2) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "slide",
        data: { v3id: 4 },
        flip: d => d,
    });

    const arrow = ctx.createCellType({
        behavior: class ArrowCell extends Cell {
            push(dir: Direction, bias: number) {
                if (this.direction == dir) return super.push(dir, bias);
                return false;
            }
        },
        textureName: "arrow",
    });

    const enemy = ctx.createCellType({
        behavior: class EnemyCell extends Cell {
            push() {
                this.rm();
                return null;
            }
        },
        textureName: "enemy",
        data: { v3id: 7 },
        flip: d => d,
    });

    const trash = ctx.createCellType({
        behavior: class TrashCell extends Cell {
            push() {
                return null;
            }
        },
        textureName: "trash",
        data: { v3id: 8 },
        flip: d => d,
    });

    const wall = ctx.createCellType({
        behavior: class WallCell extends Cell {
            push() {
                return false;
            }
        },
        textureName: "wall",
        data: { v3id: 6 },
        flip: d => d,
    });

    ctx.addSlot(generator);
    ctx.addSlot(mover);
    ctx.addSlot(cwRotator, ccwRotator);
    ctx.addSlot(push, slide, arrow);
    ctx.addSlot(enemy);
    ctx.addSlot(trash);
    ctx.addSlot(wall);

    function findCell(id: number) {
        return Object.values(cells).find(t => t.data?.v3id == id);
    }

    ctx.registerLevelCode("V1", (parts, grid) => {
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

    ctx.registerLevelCode("V3", (parts, grid) => {
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
