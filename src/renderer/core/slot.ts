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
