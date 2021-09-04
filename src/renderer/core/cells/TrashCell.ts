import { Cell, CellType_ } from "@core/cell";

export class TrashCell extends Cell {
    push() {
        return null;
    }
}

export const trashCell = CellType_.create({
    behavior: TrashCell,
    textureName: "trash",
    data: { v3id: 8 }
});
