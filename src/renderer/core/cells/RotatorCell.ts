import { Off } from "@utils/positions";
import { Cell, CellType, Direction } from "@core/cell";

export const cwRotatorCell = CellType.create({
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
    flip: (options) => [ccwRotatorCell, options[1]],
});
export const ccwRotatorCell = CellType.create({
    behavior: cwRotatorCell.behavior,
    textureName: "ccwRotator",
    data: { v3id: 2, rotation: -1 },
    flip: (options) => [cwRotatorCell, options[1]],
});
