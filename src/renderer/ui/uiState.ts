import { writable } from "svelte/store";
import { Size } from "../utils/size";
import { on } from "./keys";

export const menuOpen = writable(false);
let $menuOpen = false;
menuOpen.subscribe(v => $menuOpen = v);

export const importLevel = writable(true);
let $importLevel = false;
importLevel.subscribe(v => $importLevel = v);

importLevel.subscribe(l => l == true && menuOpen.set(false));

export const showControls = writable(true);

export const showHelp = writable(false);

export const createLevel = writable(false);

export const settings = writable(false);


export const moving = {
    up: false,
    right: false,
    down: false,
    left: false,
};

addMoveKey("w", "up");
addMoveKey("d", "right");
addMoveKey("s", "down");
addMoveKey("a", "left");


function addMoveKey(k: string, p: keyof typeof moving) {
    on(k)
    .up(() => moving[p] = false)
    .when(() => !$menuOpen && !$importLevel).down(() => moving[p] = true);
}

export const selection = writable<Size | null>(null);
