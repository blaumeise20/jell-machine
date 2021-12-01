import { Cell } from "@core/cells/cell";
import { UpdateType } from "@core/cells/cellUpdates";
import { CellGrid, openLevel } from "@core/cells/grid";
import { LevelCode } from "@core/levelCode";
import { Tile } from "@core/tiles";
import { $config } from "@utils/config";
import { Pos } from "@core/coord/positions";
import { Size } from "@core/coord/size";
import { Registry } from "@core/registry";
import { Direction } from "@core/coord/direction";
import { Menu } from "@core/ui/menu";
import { block, button, text, UIText, UITextSize } from "@core/ui/build";
import { get } from "svelte/store";
import { CellType } from "@core/cells/cellType";
import { Events } from "@core/events";
import { Slot } from "@core/slot";

export function load() {
    const orientator = CellType.create("jm.utils.orientator", {
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

    const disabler = CellType.create("jm.utils.disabler", {
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

    //#region note cell
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

    const note = CellType.create("jm.utils.note", {
        textureName: "note",
        behavior: class NoteCell extends Cell {
            push() {
                noteTicks.add(noteNames[this.pos.y % noteNames.length] as keyof typeof notes);
                return null;
            }
        },
        flip: d => d
    });

    Events.on("tickend", () => {
        noteTicks.forEach(note => play(note));
        noteTicks.clear();

        oscillators.forEach(oscillator => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), $config.tickSpeed);
        });

        oscillators.length = 0;
    });

    const jell = CellType.create("jm.utils.jell", {
        behavior: class JellCell extends Cell {
            private _generatedIn = this.grid.initial ? -1 : this.grid.tickCount;
            private get isGen() { return this.grid.tickCount == this._generatedIn; }

            update() {
                if (this.isGen) return;

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

    const random = CellType.create("jm.utils.random", {
        behavior: class RandomCell extends Cell {
            update() {
                const pos = this.getCellTo((Direction.Right + this.direction) % 4);
                if (!pos) return;

                this.grid.cells.get(pos[0])?.rotate(Math.random() > 0.5 ? 1 : -1);
            }
        },
        textureName: "random",
        updateType: UpdateType.Directional,
        updateOrder: 2.1,
    });

    const piston = CellType.create("jm.utils.piston", {
        behavior: class PistonCell extends Cell {
            extended = false;
            actuallyExtended = false;

            debugText() {
                return "Extended: " + this.extended;
            }

            reset() {
                super.reset();
                this.extended = false;
                this.actuallyExtended = false;
            }
            update() {
                if (this.extended) {
                    const pos = this.getCellTo(this.direction);
                    if (!pos) return;

                    const cell = this.grid.cells.get(pos[0]);

                    if (cell) {
                        if (cell.type == pistonHead) return;
                        if (!cell.push(pos[1], 1)) return;
                    }

                    this.actuallyExtended = true;
                    this.grid.loadCell(pos[0], pistonHead, pos[1]);
                }
                else {
                    const pos = this.getCellTo(this.direction);
                    if (!pos) return;

                    const cell = this.grid.cells.get(pos[0]);

                    if (cell && cell.type == pistonHead && cell.direction == pos[1]) {
                        cell.rm();
                        this.actuallyExtended = false;
                    }
                }
            }

            push(dir: Direction, bias: number) {
                if (dir == this.direction) {
                    this.extended = !this.extended;
                    return null;
                }
                if (this.extended) return false;
                return super.push(dir, bias);
            }
            rotate(dir: number) {
                if (this.extended) return;
                super.rotate(dir);
            }
            setRotation(dir: number) {
                if (this.extended) return;
                super.setRotation(dir);
            }
        },
        textureName: "pistonOff",
        textureOverride: c => (c as any).actuallyExtended ? "pistonOn" : "pistonOff",
        updateType: UpdateType.Directional,
        updateOrder: 5,
    });

    const pistonHead = CellType.create("jm.utils.piston_head", {
        behavior: class PistonHeadCell extends Cell {
            push() {
                return false;
            }

            rotate() {}
            setRotation() {}
        },
        textureName: "pistonHead",
    });


    Slot.add(orientator, disabler, note, jell, random, piston);

    // ctx.createTool("canOpen", "Automatically Can Open selected area", canOpen);

    LevelCode.create("J1")
        .import((parts, grid) => {
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
                const cell = Registry.getCell(cellId);
                if (!cell) throw new Error();

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
        })
        .export(grid => {
            const cellMap: string[] = [];
            const cellArr: string[] = [];

            for (let y = 0; y < grid.size.height; y++) {
                for (let x = 0; x < grid.size.width; x++) {
                    const pos = Pos(x, y);
                    const cell = grid.cells.get(pos);
                    let ct = "";

                    if (grid.tiles.get(pos) == Tile.Placable) ct += ":";

                    if (cell) {
                        let cellIx = cellMap.indexOf(cell.type.id);
                        if (cellIx == -1) { cellMap.push(cell.type.id); cellIx = cellMap.length - 1; }

                        ct += encodeJ1Num((cellIx * 4 + cell.direction) + 1);
                    }
                    else ct += encodeJ1Num(0);

                    cellArr.push(ct);
                }
            }

            for (let i = 0; i < cellMap.length; i++) {
                if (cellMap[i].startsWith("jm.utils")) {
                    cellMap[i] = "." + cellMap[i].substr(8);
                }
                else if (cellMap[i].startsWith("jm.core")) {
                    cellMap[i] = cellMap[i].substr(7);
                }
            }

            let length = cellArr.length;
            while (cellArr[length - 1] == "0" && length > 0) length--;
            cellArr.length = length;


            const cellsText: string[] = [];
            let prev = "";
            let count = 1;
            for (let i = 0; i <= cellArr.length; i++) {
                const ca = cellArr[i];

                if (ca == prev) {
                    count++;
                }
                else {
                    if (prev !== "") {
                        cellsText.push(prev);
                        if (count == 2) cellsText.push(prev);
                        else if (count == 3) cellsText.push(prev, prev);
                        if (count > 3) {
                            const num = encodeJ1Num(count - 4);
                            if (num.length == 1) cellsText.push(">" + num);
                            else cellsText.push("<" + num + ">");
                        }
                    }

                    count = 1;
                    prev = ca;
                }
            }

            const result = [
                "J1",
                encodeJ1Num(grid.size.width),
                encodeJ1Num(grid.size.height),
                cellMap.join(","),
                cellsText.join(""),
            ];
            const description = grid.description.trim();
            if (description) {
                result.push(description);

                const name = grid.name.trim();
                if (name) result.push(name);
            }

            return result.join(";");
        });

    let tickCount: UIText;
    const ui = block(
        tickCount = text("Tick Count: 0"),
        button("Reset", { onClick: () => get(openLevel)!.reset() }),
    );
    Events.on("tickend", () => tickCount.text = "Tick Count: " + get(openLevel)!.tickCount);

    Menu.addUI(ui);
}

function canOpen(grid: CellGrid) {
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

const codeJ1 = makeConverter("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.-_+*#'!\"$%&/()=?[]|{}");
const decodeJ1Num = codeJ1.decode;
const encodeJ1Num = codeJ1.encode;

function makeConverter(code: string) {
    const base = code.length;

    const decode = {} as Record<string, number>;
    for (let i = 0; i < code.length; i++) decode[code[i]] = i;

    return {
        encode: (num: number) => {
            if (num == 0) return code[0];

            let str = "";
            while (num > 0) {
                str = code[num % base] + str;
                num = Math.floor(num / base);
            }
            return str;
        },
        decode: (str: string) => {
            let num = 0;
            for (const key of str) {
                num = num * base + (decode[key])
                if (isNaN(num)) throw new Error("Invalid input string");
            };
            return num;
        }
    };
}
