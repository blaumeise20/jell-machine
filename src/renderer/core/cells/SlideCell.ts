import { Cell, CellType, Direction } from "@core/cell";

export const slideCell = CellType.create({
    behavior: class SlideCell extends Cell {
        push(dir: Direction, bias: number) {
            if (this.direction % 2 == dir % 2) return super.push(dir, bias);
            return false;
        }
    },
    textureName: "slide",
    data: { v3id: 4 }
});
