import { Cell, Direction } from "../cell";

export class SlideCell extends Cell {
    push(dir: Direction, bias: number) {
        if (this.direction % 2 == dir % 2) return super.push(dir, bias);
        return false;
    }
}
