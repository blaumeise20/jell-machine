import { Off } from "../../utils/positions";
import { Cell } from "../cell";

export class GeneratorCell extends Cell {
    update() {
        const source = this.pos.mi(Off[(this.direction + 2) % 4]);

        const sourceCell = this.grid.cells.get(source);
        if (!sourceCell) return;

        const target = this.pos.mi(Off[this.direction]);
        if (!this.grid.size.contains(target)) return;

        if (this.grid.cells.get(target)?.push(this.direction, 1) == false) return;

        this.grid.loadCell(target, sourceCell.type, sourceCell.direction);
    }
}
