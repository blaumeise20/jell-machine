import type { UIBlock } from "./block";
import { UIElement } from "./element";

export class UIColumns extends UIElement {
    constructor(public left: UIBlock, public right: UIBlock) {
        super();
        left.parent = this;
        right.parent = this;

        this.element = document.createElement("div");
        this.element.classList.add("ui-columns");
        this.element.appendChild(left.element);
        this.element.appendChild(right.element);
    }

    clone(): UIColumns {
        return new UIColumns(this.left.clone(), this.right.clone());
    }
}

export function columns(left: UIBlock, right: UIBlock): UIColumns {
    return new UIColumns(left, right);
}
