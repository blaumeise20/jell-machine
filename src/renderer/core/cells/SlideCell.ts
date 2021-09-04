import { Cell, CellType_, Direction } from "@core/cell";

export class SlideCell extends Cell {
    push(dir: Direction, bias: number) {
        if (this.direction % 2 == dir % 2) return super.push(dir, bias);
        return false;
    }
}

export const slideCell = CellType_.create({
    behavior: SlideCell,
    textureName: "slide",
    data: { v3id: 4 }
});
