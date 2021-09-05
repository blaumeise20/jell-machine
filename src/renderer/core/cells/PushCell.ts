import { Cell, CellType } from "@core/cell";

export const pushCell = CellType.create({
    behavior: Cell,
    textureName: "push",
    data: { v3id: 5 },
    flip: d => d,
});
