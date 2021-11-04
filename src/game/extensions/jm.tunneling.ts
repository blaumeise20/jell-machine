import { Cell, CellType } from "@core/cells/cell";
import { Direction } from "@core/coord/direction";
import { ExtensionContext } from "@core/extensions";

export function load(ctx: ExtensionContext) {
    const redirector = ctx.createCellType("jm.tunneling.redirector", {
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

    const tunnel = ctx.createCellType("jm.tunneling.tunnel", {
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

    const crossway = ctx.createCellType("jm.tunneling.crossway", {
        behavior: class CrosswayCell extends Cell {
            getPos(dir: Direction) {
                return super.getCellTo(dir);
            }
        },
        textureName: "crossway",
        flip: d => d,
    });

    const crossdirector = ctx.createCellType("jm.tunneling.crossdirector", {
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

    ctx.addSlot(redirector, tunnel, crossway, crossdirector);
}
