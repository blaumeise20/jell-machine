import { Cell, Direction } from "@core/cell";
import { UpdateType } from "@core/cellUpdates";
import { Extension, ExtensionContext } from "@core/extensions";
import { CellGrid } from "@core/grid";
import { Off, Pos } from "@utils/positions";
import { Size } from "@utils/size";

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

    ctx.createTool("canOpen", "Automatically Can Open selected area", canOpen);
}

function canOpen(grid: CellGrid) {
    const vaultArea = grid.selectedArea;
    if (!vaultArea) return;

    const core_ = Extension.get("jm.core");
    if (!core_) return;
    const cell_trash = core_.data.trash;
    const cell_wall = core_.data.wall;
    const cell_generator = core_.data.generator;
    const cell_push = core_.data.push;
    const cell_slide = core_.data.slide;
    const cell_mover = core_.data.mover;
    const cell_rotator = core_.data.ccwRotator;

    // place can opener
    const canOpenerHeight = vaultArea.height + 2;
        // generators
        if (!grid.fillCell(new Size(vaultArea.width + 1, canOpenerHeight - 1, vaultArea.bottom + vaultArea.height + canOpenerHeight, vaultArea.left), cell_generator, Direction.Down)) return;

        // push
        if (!grid.fillCell(new Size(vaultArea.width + 1, canOpenerHeight, vaultArea.bottom + vaultArea.height, vaultArea.left), cell_push, Direction.Right)) return;

        // rotators
        for (let x = 0; x < vaultArea.width; x++) {
            for (let y = 0; y < vaultArea.height; y++) {
                const cell = grid.cells.get(Pos(vaultArea.left + x, vaultArea.bottom + y));
                if (!cell) continue;

                let placeRotator = false;
                switch (cell.type) {
                    case cell_trash:
                    case cell_wall:
                        return;
                    case cell_slide:
                        if (cell.direction % 2 == 0)
                            placeRotator = true;
                        break;
                    case cell_mover:
                        if (cell.direction == Direction.Up)
                            placeRotator = true;
                        break;
                    case cell_generator:
                        if (cell.direction == Direction.Right)
                            placeRotator = true;
                        break;
                }

                if (placeRotator) {
                    grid.loadCell(Pos(vaultArea.left + x + 1, vaultArea.bottom + vaultArea.height + y + 1), cell_rotator, Direction.Right);
                }
            }
        }


    // place trashes
    if (!grid.fillCell(new Size(vaultArea.width + 2, 1, vaultArea.bottom - 1, vaultArea.left - 1), cell_trash, Direction.Right)) return;

    // place walls
        // left
        if (!grid.fillCell(new Size(1, vaultArea.height + 1 + canOpenerHeight + canOpenerHeight, vaultArea.bottom - 1, vaultArea.left - 1), cell_wall, Direction.Right)) return;

        // right
        if (!grid.fillCell(new Size(1, vaultArea.height + 1 + canOpenerHeight + canOpenerHeight, vaultArea.bottom - 1, vaultArea.left + vaultArea.width + 1), cell_wall, Direction.Right)) return;

        // top
        if (!grid.fillCell(new Size(vaultArea.width + 1, 1, vaultArea.bottom + vaultArea.height + canOpenerHeight + canOpenerHeight - 1, vaultArea.left), cell_wall, Direction.Down)) return;

}
