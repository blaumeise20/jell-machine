import { Cell } from "../cell";

export class EnemyCell extends Cell {
    push() {
        this.rm(true);
        return null;
    }
}
