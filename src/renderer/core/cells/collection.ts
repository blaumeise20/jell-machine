import { Extension } from "@core/extensions";
import { load } from "../../extensions/builtin";

export const builtinCells = Extension.load("core", load).cells ?? [];
