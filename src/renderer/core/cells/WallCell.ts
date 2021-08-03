import { Cell } from "../cell";

export class WallCell extends Cell {
    push() {
        return false;
    }
}
