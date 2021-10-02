import { writable, Writable } from "svelte/store";
import { CellType } from "./cell";

export class Slot {
    items: CellType[];
    index: number;

    get currentItem() {
        return this.items[this.index];
    }

    constructor(items: CellType[]) {
        this.items = items;
        this.index = 0;
    }

    next() {
        this.index = (this.index + 1) % this.items.length;
    }
}

export class SlotHandler {
    public slots: Writable<SlotData[]>;
    public currentCell: Writable<CellType>;
    public currentSlot = 0;
    private _containedSlots!: Slot[];

    constructor(slots: Slot[]) {
        this.slots = writable([]);
        this.currentCell = writable(slots[0].currentItem);
        this.containedSlots = slots;
    }

    public get containedSlots() {
        return this._containedSlots;
    }
    public set containedSlots(slots: Slot[]) {
        this._containedSlots = slots;
        this.currentSlot = Math.min(this.currentSlot, this.containedSlots.length);
        this._reload();
    }

    public getSlotData() {
        return this.containedSlots.map((slot, index) => {
            return {
                index: index,
                currentItem: slot.currentItem,
                isActive: index == this.currentSlot,
            };
        });
    }

    public next() {
        this.currentSlot = (this.currentSlot + 1) % this.containedSlots.length;
        this._reload();
    }

    public prev() {
        this.currentSlot = (this.currentSlot - 1 + this.containedSlots.length) % this.containedSlots.length;
        this._reload();
    }

    public to(index: number) {
        this.currentSlot = index % this.containedSlots.length;
        this._reload();
    }

    public loopSlot() {
        this.containedSlots[this.currentSlot].next();
        this._reload();
    }

    private _reload() {
        this.currentCell.set(this.containedSlots[this.currentSlot].currentItem);
        this.slots.set(this.getSlotData());
    }
}

export type SlotData = {
    index: number,
    currentItem: CellType,
    isActive: boolean,
};
