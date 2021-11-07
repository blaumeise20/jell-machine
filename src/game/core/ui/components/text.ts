import { UIElement } from "./element";

export class UIText extends UIElement {
    size: UITextSize;
    private _text: string;
    get text(): string {
        return this._text;
    }
    set text(value: string) {
        this.text = value;
        this.element.replaceChild(document.createTextNode(value), this.element.firstChild!);
    }
    bold: boolean;
    italic: boolean;

    constructor(text: string, options: UITextOptions) {
        super();

        this._text = text;
        this.size = options.size || UITextSize.Normal;
        this.bold = options.bold || false;
        this.italic = options.italic || false;

        this.element = document.createElement("div");
        this.element.classList.add("ui-text");
        this.element.classList.add(`ui-text-${this.size}`);
        if (this.bold) this.element.classList.add(`ui-text-bold`);
        if (this.italic) this.element.classList.add(`ui-text-italic`);
        this.element.appendChild(document.createTextNode(text));
    }

    clone(): UIText {
        return new UIText(this.text, { size: this.size });
    }
}
export interface UITextOptions {
    size?: UITextSize;
    bold?: boolean;
    italic?: boolean;
}
export enum UITextSize {
    Small = "small",
    Normal = "normal",
    Large = "large",
}

export function text(text: string, options: UITextOptions = {}) {
    return new UIText(text, options);
}
