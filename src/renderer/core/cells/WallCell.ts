import { Cell, CellType } from "@core/cell";

export const wallCell = CellType.create({
    behavior: class WallCell extends Cell {
        push() {
            return false;
        }
    },
    textureName: "wall",
    data: { v3id: 6 },
    flip: d => d,
});
