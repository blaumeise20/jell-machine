import { UIElement } from "./element";

export class UIInputField extends UIElement {
    override element: HTMLInputElement;

    private _placeholder: string;
    get placeholder(): string {
        return this._placeholder;
    }
    set placeholder(value: string) {
        this._placeholder = value;
        this.element.setAttribute("placeholder", value);
    }
    private _value: string;
    get value(): string {
        return this._value;
    }
    set value(value: string) {
        this._value = value;
        this.element.value = value;
    }
    onChange: ((value: string) => void) | undefined;

    constructor(options: UIInputOptions) {
        super();

        this._placeholder = options.placeholder || "";
        this._value = options.value || "";
        this.onChange = options.onChange;

        this.element = document.createElement("input");
        this.element.classList.add("ui-input");
        this.element.setAttribute("type", "text");
        this.element.setAttribute("placeholder", this._placeholder)
        this.element.value = options.value || "";
        this.element.addEventListener("input", () => {
            this.value = this.element.value;
            if (this.onChange) this.onChange(this.value);
        });
    }

    clone(): UIInputField {
        return new UIInputField({
            placeholder: this._placeholder,
            value: this._value,
        });
    }

}
export interface UIInputOptions {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export function input(options: UIInputOptions = {}): UIInputField {
    return new UIInputField(options);
}
