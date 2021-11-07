import { UIElement } from "./element";

export class UIBlock extends UIElement {
    children: UIElement[] = [];

    constructor(children: UIElement[]) {
        super();
        this.children = children;

        this.element = document.createElement("div");
        this.element.classList.add("ui-block");
        for (const child of children) {
            child.parent = this;
            this.element.appendChild(child.element);
        }
    }

    append(child: UIElement): this {
        this.children.push(child);
        child.parent = this;
        this.element.appendChild(child.element);
        return this;
    }

    clone(): UIBlock {
        const children = this.children.map(c => c.clone());
        return new UIBlock(children);
    }
}

export function block(...children: UIElement[]) {
    return new UIBlock(children);
}


// () => {
//     block()
//         .button("Hello")
//         .text("hi")
//         .block(b =>
//             b.button("Hello")
//         )
//         .columns(b =>
//             b.button("Hello"),
//         b =>
//             b.button("Hello")
//         );
// }

// () => {
//     block(
//         button("Hello"),
//         text("hi"),
//         block(
//             button("Hello"),
//         ),
//         columns(
//             button("Hello"),
//         ),
//     )
// }
