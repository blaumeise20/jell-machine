import { Cell, CellType_ } from "@core/cell";

export class EnemyCell extends Cell {
    push() {
        this.rm();
        return null;
    }
}

export const enemyCell = CellType_.create({
    behavior: EnemyCell,
    textureName: "enemy",
    data: { v3id: 7 }
});
