import { Cell, CellType, Direction } from "@core/cell";

export const moverCell = CellType.create({
    behavior: class MoverCell extends Cell {
        update() {
            super.push(this.direction, 1);
        }

        push(dir: Direction, bias: number) {
            if (dir == this.direction) return super.push(dir, bias + 1);
            if ((dir + 2) % 4 == this.direction) return super.push(dir, bias - 1);
            return super.push(dir, bias);
        }
    },
    textureName: "mover",
    data: { v3id: 3 },
});
