import { ExtensionContext } from "@core/extensions";
import { Off } from "@utils/positions";
import { Cell, Direction } from "@core/cell";

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
    });
    const ccwRotator = ctx.createCellType({
        behavior: cwRotator.behavior,
        textureName: "ccwRotator",
        data: { v3id: 2, rotation: -1 },
        flip: (options) => [cwRotator, options[1]],
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
    ctx.addSlot(cwRotator);
    ctx.addSlot(ccwRotator);
    ctx.addSlot(push);
    ctx.addSlot(slide);
    ctx.addSlot(enemy);
    ctx.addSlot(trash);
    ctx.addSlot(wall);

    return {
        generator,
        mover,
        cwRotator,
        ccwRotator,
        push,
        slide,
        enemy,
        trash,
        wall,
    };
}
