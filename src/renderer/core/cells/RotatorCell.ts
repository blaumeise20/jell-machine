import { Off } from "../../utils/positions";
import { Cell, CellType, Direction } from "../cell";

export class RotatorCell extends Cell {
    update() {
        const rotation = this.type == CellType.CWrotator ? 1 : -1;

        this.grid.cells.get(this.pos.mi(Off[Direction.Right]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Down]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Left]))?.rotate(rotation);
        this.grid.cells.get(this.pos.mi(Off[Direction.Up]))?.rotate(rotation);
    }
}
