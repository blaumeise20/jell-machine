import { Extension } from "@core/extensions";
import { load as builtin } from "../../extensions/builtin";
import { load as music } from "../../extensions/music";

export const builtinCells = Extension.load("jm.core", builtin).cells ?? [];
export const builtinSlots = Extension.get("jm.core")?.slots ?? [];
export const musicCells = Extension.load("jm.music", music).cells ?? [];
export const musicSlots = Extension.get("jm.music")?.slots ?? [];
