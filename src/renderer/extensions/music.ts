import { ExtensionContext } from "@core/extensions";
import { Cell } from "@core/cell";
import { $config } from "@utils/config";

export function load(ctx: ExtensionContext) {
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
    ctx.createCellType({
        textureName: "note",
        behavior: class NoteCell extends Cell {
            push() {
                noteTicks.add(noteNames[this.pos.y % noteNames.length] as keyof typeof notes);
                return null;
            }
        },
        flip: d => d
    });

    ctx.onTickEnd(() => {
        noteTicks.forEach(note => play(note));
        noteTicks.clear();

        oscillators.forEach(oscillator => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), $config.tickSpeed);
        });

        oscillators.length = 0;
    });
}
