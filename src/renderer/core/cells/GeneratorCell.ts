import { Off } from "@utils/positions";
import { Cell, CellType } from "@core/cell";

export const generatorCell = CellType.create({
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
    data: { v3id: 0 }
});
