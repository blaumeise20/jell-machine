import { UIElement } from "./element";

export class UIButton extends UIElement {
    onClick: ((btn: UIButton) => any) | undefined;
    private _label: string;
    get label(): string {
        return this._label;
    }
    set label(value: string) {
        this._label = value;
        this.element.replaceChild(document.createTextNode(value), this.element.firstChild!);
    }

    constructor(label: string, options: UIButtonOptions) {
        super();

        this._label = label;
        this.onClick = options.onClick;

        this.element = document.createElement("button");
        this.element.classList.add("ui-button");
        this.element.appendChild(document.createTextNode(label));
        this.element.addEventListener("click", () => {
            if (this.onClick) this.onClick(this);
        });
    }

    clone(): UIButton {
        return new UIButton(this.label, {});
    }
}

export interface UIButtonOptions {
    onClick?: (btn: UIButton) => any;
}

export function button(label: string, options: UIButtonOptions = {}) {
    return new UIButton(label, options);
}
