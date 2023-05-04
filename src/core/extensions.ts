import type { CellType } from "@core/grid/cellType";
import type { UpdateType } from "@core/grid/cellUpdates";
import { Registry } from "./registry";

/**
 * An unique identifier for every item (tools, cell types, etc.) in the game.
 */
export type ItemIdentifier = string;

export class Extension {
    id!: string;

    static extensions: Extension[] = [];

    static load(id: string, extensionLoader: () => void) {
        const extension = new Extension();
        extension.id = id;

        extensionLoader();

        this.extensions.push(extension);
    }

    static getUpdateOrder(): [CellType, UpdateType][] {
        const result: [CellType, UpdateType][] = [];

        Registry.getCells().forEach(cell => {
            if (cell.options.updateType != null) {
                result.push([cell, cell.options.updateType]);
            }
        });

        return result.sort((a, b) => a[0].options.updateOrder! - b[0].options.updateOrder!);
    }


    static createExtension(name: string, identifier: string, data: {}, code: string) {
        let text: string[] = [];

        text.push("Jell Machine Extension\u0000");

        text.push(name);
        text.push("\u0001");

        text.push(identifier);
        text.push("\u0001");

        text.push(JSON.stringify(data));
        text.push("\u0002");

        text.push(code);

        return text.join("");
    }

    static parseExtension(text: string): false | { name: string, data: {}, code: string } {
        if (!text.startsWith("Jell Machine Extension\u0000")) return false;

        text = text.substr("Jell Machine Extension\u0000".length);

        const name = text.split("\u0001")[0];
        text = text.substr(name.length + 1);

        const data = JSON.parse(text.split("\u0002")[0]);
        text = text.substr(JSON.stringify(data).length + 1);

        const code = text;

        return { name, data, code };
    }
}

// console.log(Extension.parseExtension("Jell Machine Extension\u0000Test\u0001{}\u0002console.log(\"Hello World!\");"));
