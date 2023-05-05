import { resolvePath } from "@utils/platform";
import { CellGrid } from "@core/grid/cellGrid";

export class Structure {
    constructor(public name: string, public path: string) {}

    read(): CellGrid | null {
        if (!existsSync(this.path)) return null;

        const content = readFileSync(this.path, "utf8");
        const result = CellGrid.loadFromString(content);
        if (result[0]) return result[1];
        return null;
    }
}

export const structures: Structure[] = [];

// TODO
const fs = null as any;
const { readdirSync, readFileSync, existsSync, mkdirSync } = (fs || {} as any as typeof fs)!;
if (fs) {
    const structureDir = "structures";
    if (!existsSync(structureDir)) {
        mkdirSync(structureDir);
    }

    for (const [name, path] of readRecursive(structureDir)) {
        structures.push(new Structure(name, path));
    }
}

function *readRecursive(path: string, base: string = ""): IterableIterator<[string, string]> {
    const files = readdirSync(path, { withFileTypes: true });
    for (const file of files) {
        const fullPath = resolvePath(path, file.name);
        const name = resolvePath(base, file.name);
        if (file.isDirectory()) {
            yield *readRecursive(fullPath, name);
        }
        else {
            yield [name, fullPath];
        }
    }
}
