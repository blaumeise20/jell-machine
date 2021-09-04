import { Cell, CellType_ } from "@core/cell";

export class WallCell extends Cell {
    push() {
        return false;
    }
}

export const wallCell = CellType_.create({
    behavior: WallCell,
    textureName: "wall",
    data: { v3id: 6 }
});
