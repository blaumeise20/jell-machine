import { Cell, Direction } from "@core/cell";
import { UpdateType } from "@core/cellUpdates";
import { ExtensionContext } from "@core/extensions";
import { Off } from "@utils/positions";

export function load(ctx: ExtensionContext) {
    const orientator = ctx.createCellType({
        behavior: class OrientatorCell extends Cell {
            update() {
                this.grid.cells.get(this.pos.mi(Off[Direction.Right]))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Off[Direction.Down]))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Off[Direction.Left]))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Off[Direction.Up]))?.setRotation(this.direction);
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "orientator",
        updateType: UpdateType.Directional,
        updateOrder: 2.5,
    });

    const disabler = ctx.createCellType({
        behavior: class DisablerCell extends Cell {
            update() {
                this.grid.cells.get(this.pos.mi(Off[Direction.Right]))?.disable();
                this.grid.cells.get(this.pos.mi(Off[Direction.Down]))?.disable();
                this.grid.cells.get(this.pos.mi(Off[Direction.Left]))?.disable();
                this.grid.cells.get(this.pos.mi(Off[Direction.Up]))?.disable();
            }

            disable() {}
        },
        textureName: "disabler",
        updateType: UpdateType.Random,
        updateOrder: 0,
    });

    ctx.addSlot(orientator, disabler);
}
