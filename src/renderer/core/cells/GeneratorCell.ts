import { Off, Position } from "../../utils/positions";
import { Cell, CellType, Direction } from "../cell";

export class GeneratorCell extends Cell {
    update() {
        const source = this.pos.mi(Off[(this.direction + 2) % 4]);

        const sourceCell = this.grid.cells.get(source);
        if (!sourceCell) return;

        const target = this.pos.mi(Off[this.direction]);
        if (!this.grid.size.contains(target)) return;

        const block = this.grid.cells.get(target);
        // if (!this.grid.cells.get(target)?.push(this.direction, 1)) return;
        if (block) {
            const res = block.push(this.direction, 1);
            if (!res) return;
        }

        this.grid.loadCell(target, sourceCell.type, sourceCell.direction);
    }
}
