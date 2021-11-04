import { Cell } from "@core/cell";
import { UpdateType } from "@core/cellUpdates";
import { Extension, ExtensionContext } from "@core/extensions";
import { CellGrid } from "@core/grid";
import { $config } from "@utils/config";
import { Pos } from "@core/coord/positions";
import { Size } from "@core/coord/size";
import { Direction } from "@core/coord/direction";

export function load(ctx: ExtensionContext) {
    const orientator = ctx.createCellType({
        behavior: class OrientatorCell extends Cell {
            update() {
                this.grid.cells.get(this.pos.mi(Direction.Right))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Down))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Left))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Up))?.setRotation(this.direction);
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "orientator",
        updateType: UpdateType.Directional,
        updateOrder: 2.5,
    });

    const disabler = ctx.createCellType({
        behavior: class DisablerCell extends Cell {
            update() {
                this.grid.cells.get(this.pos.mi(Direction.Right))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Down))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Left))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Up))?.disable();
            }

            disable() {}
        },
        textureName: "disabler",
        updateType: UpdateType.Random,
        updateOrder: 0,
    });

    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    const oscillators: OscillatorNode[] = [];

    const notes = {
        "c0": 130.81,
        "d0": 146.83,
        "e0": 164.81,
        "f0": 174.61,
        "g0": 196.00,
        "a0": 220.00,
        "b0": 246.94,

        "c1": 261.63,
        "d1": 293.66,
        "e1": 329.63,
        "f1": 349.23,
        "g1": 392.00,
        "a1": 440.00,
        "b1": 493.88,

        "c2": 523.25,
        "d2": 587.33,
        "e2": 659.25,
        "f2": 698.46,
        "g2": 783.99,
        "a2": 880.00,
        "b2": 987.77,

        "c3": 1046.50,
    };
    const noteNames = Object.keys(notes);
    const play = (note: keyof typeof notes) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = notes[note];
        oscillator.connect(gainNode);

        oscillators.push(oscillator);
        gainNode.gain.value = 1 / oscillators.length;
    };
    const noteTicks = new Set<keyof typeof notes>();

    const note = ctx.createCellType({
        textureName: "note",
        behavior: class NoteCell extends Cell {
            push() {
                noteTicks.add(noteNames[this.pos.y % noteNames.length] as keyof typeof notes);
                return null;
            }
        },
        flip: d => d
    });

    ctx.on("tickend", () => {
        noteTicks.forEach(note => play(note));
        noteTicks.clear();

        oscillators.forEach(oscillator => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), $config.tickSpeed);
        });

        oscillators.length = 0;
    });

    ctx.addSlot(orientator, disabler, note);

    ctx.createTool("canOpen", "Automatically Can Open selected area", canOpen);
}

function canOpen(grid: CellGrid) {
    const vaultArea = grid.selectedArea;
    if (!vaultArea) return;

    const core_ = Extension.get("jm.core");
    if (!core_) return;
    const cell_trash = core_.data.trash;
    const cell_wall = core_.data.wall;
    const cell_generator = core_.data.generator;
    const cell_push = core_.data.push;
    const cell_slide = core_.data.slide;
    const cell_mover = core_.data.mover;
    const cell_rotator = core_.data.ccwRotator;

    // place can opener
    const canOpenerHeight = vaultArea.height + 2;
        // generators
        if (!grid.fillCell(new Size(vaultArea.width + 1, canOpenerHeight - 1, vaultArea.bottom + vaultArea.height + canOpenerHeight, vaultArea.left), cell_generator, Direction.Down)) return;

        // push
        if (!grid.fillCell(new Size(vaultArea.width + 1, canOpenerHeight, vaultArea.bottom + vaultArea.height, vaultArea.left), cell_push, Direction.Right)) return;

        // rotators
        for (let x = 0; x < vaultArea.width; x++) {
            for (let y = 0; y < vaultArea.height; y++) {
                const cell = grid.cells.get(Pos(vaultArea.left + x, vaultArea.bottom + y));
                if (!cell) continue;

                let placeRotator = false;
                switch (cell.type) {
                    case cell_trash:
                    case cell_wall:
                        return;
                    case cell_slide:
                        if (cell.direction % 2 == 0)
                            placeRotator = true;
                        break;
                    case cell_mover:
                        if (cell.direction == Direction.Up)
                            placeRotator = true;
                        break;
                    case cell_generator:
                        if (cell.direction == Direction.Right)
                            placeRotator = true;
                        break;
                }

                if (placeRotator) {
                    grid.loadCell(Pos(vaultArea.left + x + 1, vaultArea.bottom + vaultArea.height + y + 1), cell_rotator, Direction.Right);
                }
            }
        }


    // place trashes
    if (!grid.fillCell(new Size(vaultArea.width + 2, 1, vaultArea.bottom - 1, vaultArea.left - 1), cell_trash, Direction.Right)) return;

    // place walls
        // left
        if (!grid.fillCell(new Size(1, vaultArea.height + 1 + canOpenerHeight + canOpenerHeight, vaultArea.bottom - 1, vaultArea.left - 1), cell_wall, Direction.Right)) return;

        // right
        if (!grid.fillCell(new Size(1, vaultArea.height + 1 + canOpenerHeight + canOpenerHeight, vaultArea.bottom - 1, vaultArea.left + vaultArea.width + 1), cell_wall, Direction.Right)) return;

        // top
        if (!grid.fillCell(new Size(vaultArea.width + 1, 1, vaultArea.bottom + vaultArea.height + canOpenerHeight + canOpenerHeight - 1, vaultArea.left), cell_wall, Direction.Down)) return;

}
