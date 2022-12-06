import { Cell } from "@core/cells/cell";
import { UpdateType } from "@core/cells/cellUpdates";
import type { CellGrid } from "@core/cells/grid";
import { LevelCode } from "@core/levelCode";
import { Tile } from "@core/tiles";
import { $config } from "@utils/config";
import { Pos } from "@core/coord/positions";
import { Size } from "@core/coord/size";
import { Registry } from "@core/registry";
import { Direction } from "@core/coord/direction";
import { Menu } from "@core/ui/menu";
import { block, text, UIText } from "@core/ui/build";
import { get } from "svelte/store";
import { CellType } from "@core/cells/cellType";
import { Events } from "@core/events";
import { Slot } from "@core/slot";
import { makeNumberEncoder } from "@core/numbers";
import { gridProvider } from "../ui/uiState";
import { inflateRaw, deflateRaw } from "pako";
import decode64Uint, { encode } from "@utils/decodeBase64";

export function load() {
    const orientator = CellType.create({
        id: "jm.utils.orientator",
        __rawId: 10,
        name: "Orientator",
        description: "Rotates all four touching cells in the direction it is looking.",
        behavior: class OrientatorCell extends Cell {
            override update() {
                this.grid.cells.get(this.pos.mi(Direction.Right))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Down))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Left))?.setRotation(this.direction);
                this.grid.cells.get(this.pos.mi(Direction.Up))?.setRotation(this.direction);
            }

            override rotate() {}
            override setRotation() {}
        },
        textureName: "orientator",
        updateType: UpdateType.Directional,
        updateOrder: 2.5,
    });

    const disabler = CellType.create({
        id: "jm.utils.disabler",
        __rawId: 11,
        name: "Disabler",
        description: "Prevents the four touching cells from executing their action.",
        behavior: class DisablerCell extends Cell {
            override update() {
                this.grid.cells.get(this.pos.mi(Direction.Right))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Down))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Left))?.disable();
                this.grid.cells.get(this.pos.mi(Direction.Up))?.disable();
            }

            override disable() {}
        },
        textureName: "disabler",
        updateType: UpdateType.Random,
        updateOrder: 0,
    });

    //#region note cell
    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    const oscillators: [GainNode, OscillatorNode][] = [];
    let playingNotes = 0;

    const notes = {
        // "C3":   130.81,
        // "C#3":  138.59,
        // "D3":   146.83,
        // "D#3":  155.56,
        // "E3":   164.81,
        // "F3":   174.61,
        // "F#3":  185.00,
        // "G3":   196.00,
        // "G#3":  207.65,
        // "A3":   220.00,
        // "A#3":  233.08,
        // "B3":   246.94,
        // "C4":   261.63,
        // "C#4":  277.18,
        // "D4":   293.66,
        // "D#4":  311.13,
        // "E4":   329.63,
        // "F4":   349.23,
        // "F#4":  369.99,
        // "G4":   392.00,
        // "G#4":  415.30,
        // "A4":   440.00,
        // "A#4":  466.16,
        // "B4":   493.88,
        // "C5":   523.25,
        // "C#5":  554.37,
        // "D5":   587.33,
        // "D#5":  622.25,
        // "E5":   659.25,
        // "F5":   698.46,
        // "F#5":  739.99,
        // "G5":   783.99,
        // "G#5":  830.61,
        // "A5":   880.00,
        // "A#5":  932.33,
        // "B5":   987.77,
        // "C6":   1046.50,
        "C1":   32.70,
        "C#1":  34.65,
        "D1":   36.71,
        "D#1":  38.89,
        "E1":   41.20,
        "F1":   43.65,
        "F#1":  46.25,
        "G1":   49.00,
        "G#1":  51.91,
        "A1":   55.00,
        "A#1":  58.27,
        "B1":   61.74,
        "C2":   65.41,
        "C#2":  69.30,
        "D2":   73.42,
        "D#2":  77.78,
        "E2":   82.41,
        "F2":   87.31,
        "F#2":  92.50,
        "G2":   98.00,
        "G#2":  103.83,
        "A2":   110.00,
        "A#2":  116.54,
        "B2":   123.47,
        "C3":   130.81,
        "C#3":  138.59,
        "D3":   146.83,
        "D#3":  155.56,
        "E3":   164.81,
        "F3":   174.61,
        "F#3":  185.00,
        "G3":   196.00,
        "G#3":  207.65,
        "A3":   220.00,
        "A#3":  233.08,
        "B3":   246.94,
        "C4":   261.63,
        "C#4":  277.18,
        "D4":   293.66,
        "D#4":  311.13,
        "E4":   329.63,
        "F4":   349.23,
        "F#4":  369.99,
        "G4":   392.00,
        "G#4":  415.30,
        "A4":   440.00,
        "A#4":  466.16,
        "B4":   493.88,
        "C5":   523.25,
        "C#5":  554.37,
        "D5":   587.33,
        "D#5":  622.25,
        "E5":   659.25,
        "F5":   698.46,
        "F#5":  739.99,
        "G5":   783.99,
        "G#5":  830.61,
        "A5":   880.00,
        "A#5":  932.33,
        "B5":   987.77,
        "C6":   1046.50,
        "C#6":  1108.73,
        "D6":   1174.66,
        "D#6":  1244.51,
        "E6":   1318.51,
        "F6":   1396.91,
        "F#6":  1479.98,
        "G6":   1567.98,
        "G#6":  1661.22,
        "A6":   1760.00,
        "A#6":  1864.66,
        "B6":   1975.53,
        "C7":   2093.00,
        "C#7":  2217.46,
        "D7":   2349.32,
        "D#7":  2489.02,
        "E7":   2637.02,
        "F7":   2793.83,
        "F#7":  2959.96,
        "G7":   3135.96,
        "G#7":  3322.44,
        "A7":   3520.00,
        "A#7":  3729.31,
        "B7":   3951.07,
        "C8":   4186.01,
    };
    const noteNames = Object.keys(notes);
    const play = (note: keyof typeof notes) => {
        const gain = audioContext.createGain();
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = notes[note];
        oscillator.connect(gain);
        gain.connect(gainNode);

        oscillators.push([gain, oscillator]);
    };
    const noteTicks = new Set<keyof typeof notes>();

    const note = CellType.create({
        id: "jm.utils.note",
        name: "Note Cell",
        description: "Deletes its inputs but plays a note when doing so.\nPitch is based on vertical position.",
        behavior: class NoteCell extends Cell {
            override debugText() {
                return "Note: " + noteNames[this.pos.y % noteNames.length];
            }
            override push() {
                if (!this.disabled) noteTicks.add(noteNames[this.pos.y % noteNames.length] as keyof typeof notes);
                return null;
            }
        },
        textureName: "note",
        flip: d => d
    });

    Events.on("tickend", () => {
        noteTicks.forEach(note => play(note));
        noteTicks.clear();

        oscillators.forEach(oscillator => {
            playingNotes++;
            gainNode.gain.value = 1 / playingNotes;
            oscillator[1].start();
            setTimeout(() => {
                oscillator[0].gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
                setTimeout(() => {
                    oscillator[1].stop();
                    oscillator[1].disconnect();
                    oscillator[0].disconnect();
                    playingNotes--;
                    gainNode.gain.value = 1 / playingNotes;
                }, 100);
            }, $config.tickSpeed * $config.troh);
        });

        oscillators.length = 0;
    });

    //#endregion

    const jell = CellType.create({
        id: "jm.utils.jell",
        name: "Jell Cell",
        description: "Useless. Turns all touching cells into Jell cells.",
        behavior: class JellCell extends Cell {
            private _generatedIn = this.grid.initial ? -1 : this.grid.tickCount;
            private get isGen() { return this.grid.tickCount == this._generatedIn; }

            override update() {
                if (this.isGen) return;
                // TODO: fix

                const rightCell = this.grid.cells.get(this.pos.mi(Direction.Right));
                const downCell = this.grid.cells.get(this.pos.mi(Direction.Down));
                const leftCell = this.grid.cells.get(this.pos.mi(Direction.Left));
                const upCell = this.grid.cells.get(this.pos.mi(Direction.Up));

                if (rightCell && rightCell.type != this.type) this.grid.loadCell(rightCell.pos, this.type, rightCell.direction);
                if (downCell && downCell.type != this.type) this.grid.loadCell(downCell.pos, this.type, downCell.direction);
                if (leftCell && leftCell.type != this.type) this.grid.loadCell(leftCell.pos, this.type, leftCell.direction);
                if (upCell && upCell.type != this.type) this.grid.loadCell(upCell.pos, this.type, upCell.direction);
            }
        },
        textureName: "jell",
        updateType: UpdateType.Random,
        updateOrder: -127,
    });

    const random = CellType.create({
        id: "jm.utils.random",
        name: "Random Rotator",
        description: "Rotates the cell infront of it either clockwise or counter-clockwise, chosen randomly.",
        behavior: class RandomCell extends Cell {
            override update() {
                const pos = this.getCellTo(this.direction);
                if (!pos) return;

                this.grid.cells.get(pos[0])?.rotate(Math.random() > 0.5 ? 1 : -1);
            }
        },
        textureName: "random",
        updateType: UpdateType.Directional,
        updateOrder: 2.1,
    });

    //#region portal
    let sourcePortal: PortalCell | null = null;
    class PortalCell extends Cell {
        connectedCell!: PortalCell;

        override debugText() {
            if (this.connectedCell)
                return "Connected to: " + this.connectedCell.pos.format(0);

            return "Not connected";
        }

        override getPos(dir: Direction) {
            if (!this.connectedCell) return super.getPos(dir); // annoying ts
            return this.connectedCell.getCellTo(dir);
        }
    }

    const portal = CellType.create({
        id: "jm.utils.portal",
        name: "Portal",
        description: "~bDo not use.~R\nTeleports incoming cells to the other portal linked to it. You need to place two portals for it to work.\nAny amount of portal pairs may exist on the grid. (Exporting/resetting is broken)",
        behavior: PortalCell,
        textureName: "portal",
        textureOverride: c => (c as any).connectedCell ? "portal" : "portalOff",
        flip: d => d,
    });

    Events.on("cell-placed", (_, cell) => {
        if (cell.type != portal) return;

        if (sourcePortal == null) {
            sourcePortal = cell;
        }
        else {
            cell.connectedCell = sourcePortal;
            sourcePortal.connectedCell = cell;
            sourcePortal = null;
        }
    });
    Events.on("cell-deleted", (_, cell) => {
        if (cell.type != portal) return;

        if (sourcePortal == cell) {
            sourcePortal = null;
        }

        if (cell.connectedCell) {
            cell.connectedCell.connectedCell = undefined!;
            cell.connectedCell.rm();
        }
    });
    //#endregion

    const piston = CellType.create({
        id: "jm.utils.piston",
        __rawId: 12,
        name: "Piston",
        description: "Pushes cells in the direction it is facing if extended. Can extend/retract by a cell entering from behind, which deletes the incoming cell.\nCan't be moved nor rotated while extended.",
        // Extends and retracts if a cell comes in from behind.
        // If extended it is immovable.

        behavior: class PistonCell extends Cell {
            extended = false;
            actuallyExtended = false;

            override debugText() {
                return "Extended: " + this.extended;
            }

            override update() {
                // Get head position
                const pos = this.getCellTo(this.direction);
                if (!pos) return;

                // Get cell
                const cell = this.grid.cells.get(pos[0]);

                if (this.extended) {
                    if (cell) {
                        // If cell is piston head, we don't have anything to do.
                        // There are two cases:
                        // 1. The cell is our own piston head with the correct rotation. Nothing to do.
                        // 2. The cell is another piston head. We still don't have anything to do, because piston heads can't be moved.
                        if (cell.type == pistonHead) return;

                        // Otherwise try to push. If we can't, the piston can't extend.
                        if (!cell.push(pos[1], 1)) return;
                    }

                    // Visually extend the piston and load the head.
                    this.actuallyExtended = true;
                    this.grid.loadCell(pos[0], pistonHead, pos[1]);
                }
                else {
                    // If cell is piston head, we can remove the head.
                    if (cell && cell.type == pistonHead && cell.direction == pos[1]) {
                        cell.rm();
                    }

                    // Visually retract the piston.
                    this.actuallyExtended = false;
                }
            }

            override push(dir: Direction, bias: number) {
                // If a cell comes in from the back, we flip our state.
                if (dir == this.direction) {
                    this.extended = !this.extended;
                    return null;
                }

                // If the piston is extended it can't be moved,
                if (this.extended || this.actuallyExtended) return false;
                // otherwise push.
                return super.push(dir, bias);
            }
            override rotate(dir: number) {
                if (this.extended) return;
                super.rotate(dir);
            }
            override setRotation(dir: number) {
                if (this.extended) return;
                super.setRotation(dir);
            }
        },
        textureName: "pistonOff",
        textureOverride: c => (c as any).actuallyExtended ? "pistonOn" : "pistonOff",
        updateType: UpdateType.Directional,
        updateOrder: 5,
    });

    const pistonHead = CellType.create({
        id: "jm.utils.piston_head",
        name: "Piston Head",
        description: "Placeholder cell for where the piston extends.\nCan't be moved/rotated.",
        // Used for sticky pistons,
        // not placable.

        behavior: class PistonHeadCell extends Cell {
            override push() {
                return false;
            }

            override rotate() {}
            override setRotation() {}
        },
        textureName: "pistonHead",
    });

    const stickyPiston = CellType.create({
        id: "jm.utils.sticky_piston",
        __rawId: 13,
        name: "Sticky Piston",
        description: "Pushes cells in the direction it is facing if extended. If retracted, it pulls the cell one cell away. Can extend/retract by a cell entering from behind, which deletes the incoming cell.\nCan't be moved nor rotated while extended.",
        // Sticky piston is like normal piston, but pulls the cell when retracting.

        behavior: class StickyPistonCell extends Cell {
            extended = false;
            actuallyExtended = false;

            override debugText() {
                return "Extended: " + this.extended;
            }

            override update() {
                // Get head position
                const pos = this.getCellTo(this.direction);
                if (!pos) return;

                // Get cell
                const cell = this.grid.cells.get(pos[0]);

                if (this.extended) {
                    if (cell) {
                        // If cell is piston head, we don't have anything to do.
                        // There are two cases:
                        // 1. The cell is our own piston head with the correct rotation. Nothing to do.
                        // 2. The cell is another piston head. We still don't have anything to do, because piston heads can't be moved.
                        if (cell.type == stickyPistonHead) return;

                        // Otherwise try to push. If we can't, the piston can't extend.
                        if (!cell.push(pos[1], 1)) return;
                    }

                    // Visually extend the piston and load the head.
                    this.actuallyExtended = true;
                    this.grid.loadCell(pos[0], stickyPistonHead, pos[1]);
                }
                else {
                    // If cell is piston head, we can remove the head and pull back the cell.
                    if (cell && cell.type == stickyPistonHead && cell.direction == pos[1]) {
                        const front = cell.getCellTo(cell.direction);
                        cell.rm();
                        if (front) {
                            this.grid.cells.get(front[0])?.push((front[1] + 2) & 3, 1);
                        }
                    }

                    // Visually retract the piston.
                    this.actuallyExtended = false;
                }
            }

            override push(dir: Direction, bias: number) {
                // If a cell comes in from the back, we flip our state.
                if (dir == this.direction) {
                    this.extended = !this.extended;
                    return null;
                }

                // If the piston is extended it can't be moved,
                if (this.extended || this.actuallyExtended) return false;
                // otherwise push.
                return super.push(dir, bias);
            }
            override rotate(dir: number) {
                if (this.extended) return;
                super.rotate(dir);
            }
            override setRotation(dir: number) {
                if (this.extended) return;
                super.setRotation(dir);
            }
        },
        textureName: "pistonSticky",
        textureOverride: c => (c as any).actuallyExtended ? "pistonOn" : "pistonSticky",
        updateType: UpdateType.Directional,
        updateOrder: 5,
    });

    const stickyPistonHead = CellType.create({
        id: "jm.utils.sticky_piston_head",
        name: "Sticky Piston Head",
        description: "Placeholder cell for where the sticky piston extends.\nCan't be moved/rotated.",
        // Used for sticky pistons,
        // not placable.

        behavior: class StickyPistonHeadCell extends Cell {
            override push() {
                return false;
            }

            override rotate() {}
            override setRotation() {}
        },
        textureName: "pistonStickyHead",
    });

    const nuke = CellType.create({
        id: "jm.utils.nuke",
        name: "Nuke",
        description: "Duplicates itself in a random direction.",
        // Duplicates itself to a random direction.

        behavior: class NukeCell extends Cell {
            private _generatedIn = this.grid.initial ? -1 : this.grid.tickCount;
            private get isGen() { return this.grid.tickCount == this._generatedIn; }

            override update() {
                if (this.isGen) return;
                // TODO: fix

                const dirs = [Direction.Right, Direction.Down, Direction.Left, Direction.Up];

                let runsLeft = 2;
                while (dirs.length && runsLeft--) {
                    // get and remove random direction
                    const dir = dirs.splice(Math.floor(Math.random() * dirs.length), 1)[0];

                    // get pos to push
                    const pos = this.getCellTo(dir);
                    if (!pos) continue;

                    // get cell to push
                    const cell = this.grid.cells.get(pos[0]);

                    // if cell exists push it
                    if (cell) {
                        if (!cell.push(pos[1], 1)) continue;
                    }

                    // load nuke cell in that direction
                    this.grid.loadCell(pos[0], nuke, pos[1]);
                    break;
                }
            }
        },
        textureName: "nuke",
        flip: d => d,
        updateType: UpdateType.Directional,
        updateOrder: 4,
    });

    Slot.add(orientator, disabler, note);
    Slot.add(jell, random, portal, nuke);
    Slot.add(piston, stickyPiston);

    // ctx.createTool("canOpen", "Automatically Can Open selected area", canOpen);

    LevelCode.create("J1")
        .import((parts, grid) => {
            if (parts.length == 4) {
                grid.size = new Size(decode64Num(parts[1]), decode64Num(parts[2]));

                const cellData = inflateRaw(decode64Uint(parts[3]));
                let x = 0;
                let y = grid.size.height - 1; // TODO: reverse grid coordinates
                for (let i = 0; i < cellData.length;) {
                    if (y < 0) {
                        return false;
                    }
                    const char = cellData[i++];
                    if (char == 0x45) { // E
                        // Do nothing.
                    }
                    else if (char == 0x43 || char == 0x63) { // C or c
                        let type: CellType = undefined!;
                        if (char == 0x43) { // C
                            const id = cellData[i++];
                            type = Registry.getCells().find(c => c.rawId == id)!;
                        }
                        else { // c
                            const ix = cellData.indexOf(0x01, i); // end of string
                            const id = cellData.slice(i, ix);
                            type = Registry.getCell(String.fromCharCode.apply(null, id as any as number[]))!;
                            i = ix + 1;
                        }

                        if (!type) type = Registry.getCell("?")!;

                        const dir = cellData[i++] - 0x41;
                        grid.loadCell(Pos(x, y), type, dir);
                    }

                    if (cellData[i] == 0x50) { // P
                        grid.tiles.set(Pos(x, y), Tile.Placable);
                    }

                    x++;
                    if (x >= grid.size.width) {
                        x = 0;
                        y--;
                    }
                }
            }
            else {
                // Old J1 support
                grid.size = new Size(decodeJ1Num(parts[1]), decodeJ1Num(parts[2]));

                const cellMap = parts[3].split(",");
                const data = parts[4];
                let ix = 0;

                function loadCell(value: number, placable: boolean, count: number) {
                    value = value - 1;

                    const direction = value % 4;
                    const cellIx = (value-direction) / 4;

                    let cellId = cellMap[cellIx];
                    if (!cellId) throw new Error();
                    if (cellId[0] == ".") {
                        if (cellId[1] == ".")
                            cellId = "jm.utils" + cellId.substr(1);
                        else
                            cellId = "jm.core" + cellId;
                    }
                    let cell = Registry.getCell(cellId);
                    if (!cell) cell = Registry.getCell("?")!;

                    while (count--) {
                        const pos = Pos(ix % grid.size.width, Math.floor(ix / grid.size.width));

                        if (placable) grid.tiles.set(pos, Tile.Placable);
                        if (value >= 0) grid.loadCell(pos, cell, direction);

                        ix++;
                    }
                }

                for (let i = 0; i < data.length;) {
                    let placable = false;
                    let count = 1;

                    if (data[i] == ":") {
                        i++; placable = true;
                    }

                    const value = decodeJ1Num(data[i++]);

                    if (data[i] == ">") {
                        i++;
                        count = decodeJ1Num(data[i++]) + 4;
                    }
                    else if (data[i] == "<") {
                        i++;
                        let ct = "";

                        while (data[i] != ">") ct += data[i++];
                        i++;

                        count = decodeJ1Num(ct) + 4;
                    }

                    loadCell(value, placable, count);
                }

                grid.description = parts[5]?.trim() || "";
                grid.name = parts[6]?.trim() || "";
            }
            return true;
        })
        .export(grid => {
            const cellData: number[] = [];
            for (let y = grid.size.height - 1; y >= 0; y--) { // TODO: reverse grid coordinates
                for (let x = 0; x < grid.size.width; x++) {
                    const pos = Pos(x, y);
                    const cell = grid.cells.get(pos);

                    // id
                    if (cell) {
                        const id = cell.type.rawId;
                        if (typeof id == "number") {
                            cellData.push(0x43); // C
                            cellData.push(id);
                        }
                        else {
                            cellData.push(0x63); // c
                            for (let i = 0; i < id.length; i++) {
                                cellData.push(id.charCodeAt(i));
                            }
                            cellData.push(0x01); // end of string
                        }
                        cellData.push(cell.direction + 0x41); // direction + A
                    }
                    else {
                        cellData.push(0x45); // E
                    }

                    if (grid.tiles.get(pos) == Tile.Placable) {
                        cellData.push(0x50); // P
                    }
                }
            }

            const compressed = deflateRaw(
                new Uint8Array(cellData),
                {
                    level: 9,
                    memLevel: 9,
                },
            );

            const result = [
                "J1",
                encode64Num(grid.size.width),
                encode64Num(grid.size.height),
                encode(compressed),
            ];
            return result.join(";");
        });

    let tickCount: UIText;
    const ui = block(
        tickCount = text("Tick Count: 0"),
        // button("Reset", { onClick: () => get(openLevel)!.reset() }),
    );
    Events.on("tickend", () => tickCount.text = "Tick Count: " + get(gridProvider)!.grid.tickCount);

    Menu.addUI(ui);
}

// @ts-ignore
function _canOpen(grid: CellGrid) {
    const vaultArea = grid.selectedArea;
    if (!vaultArea) return;

    const cell_trash = Registry.getCell("jm.core.trash")!;
    const cell_wall = Registry.getCell("jm.core.wall")!;
    const cell_generator = Registry.getCell("jm.core.generator")!;
    const cell_push = Registry.getCell("jm.core.push")!;
    const cell_slide = Registry.getCell("jm.core.slide")!;
    const cell_mover = Registry.getCell("jm.core.mover")!;
    const cell_rotator = Registry.getCell("jm.core.ccw_rotator")!;

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

const codeJ1 = makeNumberEncoder("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.-_+*#'!\"$%&/()=?[]|{}");
const decodeJ1Num = codeJ1.decode;
// const encodeJ1Num = codeJ1.encode;
const code64 = makeNumberEncoder("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
const decode64Num = code64.decode;
const encode64Num = code64.encode;
