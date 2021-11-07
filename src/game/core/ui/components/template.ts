import { UIElement } from "./element";

export class Template {
    constructor(public template: UIElement) {}

    create() {
        return this.template.clone();
    }
}
