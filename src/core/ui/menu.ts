import { UIElement } from "./components/element";

export namespace Menu {
    export const uiComponents: UIElement[] = [];

    export function addUI(root: UIElement) {
        uiComponents.push(root);
    }
}
