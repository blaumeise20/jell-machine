export class Stack<T> {
    private _items: T[];

    constructor() {
        this._items = [];
    }

    public next(item: T) {
        this._items.push(item);
        return this;
    }

    public back() {
        this._items.pop();
        return this;
    }

    public peek(): T | undefined {
        return this._items[this._items.length - 1];
    }

    public get length(): number {
        return this._items.length;
    }

    public replaceTop(item: T) {
        this._items[this._items.length - 1] = item;
        return this;
    }
}
