import { Cell } from "@core/cells/cell";
import { CellType } from "@core/cells/cellType";
import { Direction } from "@core/coord/direction";
import { Slot } from "@core/slot";

export function load() {
    const redirector = CellType.create({
        id: "jm.tunneling.redirector",
        __rawId: 14,
        name: "Redirector",
        description: "Redirects the input from one side to the other. Cells pushed through it get rotated.",
        behavior: class RedirectorCell extends Cell {
            override getPos(dir: Direction) {
                if (dir == ((this.direction + 2) & 3)) return super.getCellTo((this.direction + 1) & 3);

                if (dir == ((this.direction + 3) & 3)) return super.getCellTo(this.direction);

                return super.getPos(dir);
            }
        },
        textureName: "redirector",
        flip: CellType.flipTwoWay,

        onRotate: () => false,
    });

    const tunnel = CellType.create({
        id: "jm.tunneling.tunnel",
        __rawId: 15,
        name: "Tunnel",
        description: "Moves the input to the other side of the tunnel without rotating.",
        behavior: class TunnelCell extends Cell {
            override getPos(dir: Direction) {
                if (dir % 2 == this.direction % 2) return super.getCellTo(dir);

                return super.getPos(dir);
            }
        },
        textureName: "tunnel",
        flip: d => d,
        merge: (a, b) => {
            if (b[0] == tunnel && a[1] % 2 != b[1] % 2) return [crossway, Direction.Right];
            return b;
        },

        onRotate: () => false,
    });

    const crossway = CellType.create({
        id: "jm.tunneling.crossway",
        __rawId: 16,
        name: "Crossway",
        description: "Two stacked tunnels. Moves the input to the other side.",
        behavior: class CrosswayCell extends Cell {
            override getPos(dir: Direction) {
                return super.getCellTo(dir);
            }
        },
        textureName: "crossway",
        flip: d => d,
    });

    const crossdirector = CellType.create({
        id: "jm.tunneling.crossdirector",
        __rawId: 17,
        name: "Crossdirector",
        description: "Two stacked redirectors. Rotates cells going through.",
        behavior: class CrossdirectorCell extends Cell {
            override getPos(dir: Direction) {
                if (dir == this.direction) return super.getCellTo((this.direction + 3) & 3);

                if (dir == ((this.direction + 1) & 3)) return super.getCellTo((this.direction + 2) & 3);

                if (dir == ((this.direction + 2) & 3)) return super.getCellTo((this.direction + 1) & 3);

                if (dir == ((this.direction + 3) & 3)) return super.getCellTo(this.direction);

                return super.getPos(dir);
            }
        },
        textureName: "crossdirector",
        flip: CellType.flipTwoWay,

        onRotate: () => false,
    });

    Slot.add(redirector, tunnel, crossway, crossdirector);
}
