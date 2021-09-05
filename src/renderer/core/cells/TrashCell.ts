import { Cell, CellType } from "@core/cell";

export const trashCell = CellType.create({
    behavior: class TrashCell extends Cell {
        push() {
            return null;
        }
    },
    textureName: "trash",
    data: { v3id: 8 },
    flip: d => d,
});
