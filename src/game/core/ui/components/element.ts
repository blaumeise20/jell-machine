export abstract class UIElement {
    parent: UIElement | null = null;
    element!: HTMLElement;

    constructor() {}

    abstract clone(): UIElement;
}
