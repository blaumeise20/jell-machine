import { Off } from "@utils/positions";
import { Cell, CellType, CellType_, Direction } from "@core/cell";

export class RotatorCell extends Cell {
    update() {
        const rotation = this.type == CellType.CWrotator ? 1 : -1;

        this.grid.cells.get(this.pos.mi(Off[Direction.Right]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Down]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Left]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Up]))?.rotate(rotation);
    }
}

export const cwRotatorCell = CellType_.create({
    behavior: RotatorCell,
    textureName: "cwRotator",
    data: { v3id: 1 }
});
export const ccwRotatorCell = CellType_.create({
    behavior: cwRotatorCell.behavior,
    textureName: "ccwRotator",
    data: { v3id: 2 }
});
