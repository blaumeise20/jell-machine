import { Cell, CellType_ } from "@core/cell";

export const pushCell = CellType_.create({
    behavior: Cell,
    textureName: "push",
    data: { v3id: 5 }
});
