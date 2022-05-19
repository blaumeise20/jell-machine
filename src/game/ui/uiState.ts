import { derived, writable } from "svelte/store";
import { Size } from "@core/coord/size";
import { on } from "./keys";
import { CellGrid } from "@core/cells/grid";

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

export const connectServer = writable(false);

export const settings = writable(false);

export const activeLayer = derived(
    [menuOpen, mainMenu, showHelp, createLevel, connectServer, settings],
    ([$menuOpen, $mainMenu, $showHelp, $createLevel, $connectServer, $settings]) => {
        if ($showHelp     ) return "help"        as const;
        if ($createLevel  ) return "createLevel" as const;
        if ($connectServer) return "connect"     as const;
        if ($settings     ) return "settings"    as const;
        if ($mainMenu     ) return "main"        as const;
        if ($menuOpen     ) return "menu"        as const;
        else                return "game"        as const;
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
export const selectionContent = writable<CellGrid | null>(null);
export const cursorPosition = writable<{ x: number, y: number }>({ x: 0, y: 0 });
export const screenPosition = writable<{ x: number, y: number }>({ x: 0, y: 0 });
