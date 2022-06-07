import { writable } from "svelte/store";
import { Size } from "@core/coord/size";
import { CellGrid } from "@core/cells/grid";

export const showControls = writable(true);

export const selection = writable<Size | null>(null);
export const selectionContent = writable<CellGrid | null>(null);
export const cursorPosition = writable<{ x: number, y: number }>({ x: 0, y: 0 });
export const screenPosition = writable<{ x: number, y: number }>({ x: 0, y: 0 });
