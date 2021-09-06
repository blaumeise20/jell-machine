import { derived, writable } from "svelte/store";
import { Size } from "@utils/size";
import { on } from "./keys";

export const menuOpen = writable(false);
let $menuOpen = false;
menuOpen.subscribe(v => $menuOpen = v);

export const mainMenu = writable(true);
let $mainMenu = false;
mainMenu.subscribe(v => $mainMenu = v);

mainMenu.subscribe(l => l == true && menuOpen.set(false));

export const showControls = writable(true);

export const showHelp = writable(false);

export const createLevel = writable(false);

export const settings = writable(false);

export const activeLayer = derived(
    [menuOpen, mainMenu, showHelp, createLevel, settings],
    ([$menuOpen, $mainMenu, $showHelp, $createLevel, $settings]) => {
        if ($showHelp   ) return "help"       ;
        if ($createLevel) return "createLevel";
        if ($settings   ) return "settings"   ;
        if ($mainMenu   ) return "main"       ;
        if ($menuOpen   ) return "menu"       ;
        else              return "game"       ;
    }
);

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
        .when(() => !$menuOpen && !$mainMenu).down(() => moving[p] = true);
}

export const selection = writable<Size | null>(null);
