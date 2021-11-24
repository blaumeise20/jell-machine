import { Cell } from "@core/cells/cell";
import { CellType } from "@core/cells/cellType";
import { Direction } from "@core/coord/direction";
import { Slot } from "@core/slot";

export function load() {
    const redirector = CellType.create("jm.tunneling.redirector", {
        behavior: class RedirectorCell extends Cell {
            getPos(dir: Direction) {
                if (dir == (this.direction + 2) % 4) return super.getCellTo((this.direction + 1) % 4);

                if (dir == (this.direction + 3) % 4) return super.getCellTo(this.direction);

                return super.getPos(dir);
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "redirector",
        flip: CellType.flipTwoWay,
    });

    const tunnel = CellType.create("jm.tunneling.tunnel", {
        behavior: class TunnelCell extends Cell {
            getPos(dir: Direction) {
                if (dir % 2 == this.direction % 2) return super.getCellTo(dir);

                return super.getPos(dir);
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "tunnel",
        flip: d => d,
        merge: (a, b) => {
            if (b[0] == tunnel && a[1] % 2 != b[1] % 2) return [crossway, Direction.Right];
            return b;
        },
    });

    const crossway = CellType.create("jm.tunneling.crossway", {
        behavior: class CrosswayCell extends Cell {
            getPos(dir: Direction) {
                return super.getCellTo(dir);
            }
        },
        textureName: "crossway",
        flip: d => d,
    });

    const crossdirector = CellType.create("jm.tunneling.crossdirector", {
        behavior: class CrossdirectorCell extends Cell {
            getPos(dir: Direction) {
                if (dir == this.direction) return super.getCellTo((this.direction + 3) % 4);

                if (dir == (this.direction + 1) % 4) return super.getCellTo((this.direction + 2) % 4);

                if (dir == (this.direction + 2) % 4) return super.getCellTo((this.direction + 1) % 4);

                if (dir == (this.direction + 3) % 4) return super.getCellTo(this.direction);

                return super.getPos(dir);
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "crossdirector",
        flip: CellType.flipTwoWay,
    });

    Slot.add(redirector, tunnel, crossway, crossdirector);
}
