import { Cell, CellType } from "@core/cell";

export const enemyCell = CellType.create({
    behavior: class EnemyCell extends Cell {
        push() {
            this.rm();
            return null;
        }
    },
    textureName: "enemy",
    data: { v3id: 7 },
    flip: d => d,
});
