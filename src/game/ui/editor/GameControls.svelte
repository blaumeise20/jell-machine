<script lang="ts" context="module">
    import { writable, derived } from "svelte/store";
    import { on } from "../keys";
    import { config } from "@utils/config";
    import { CellGrid, initial } from "@core/cells/grid";
    import { Animator } from "@utils/animator";
    import { SlotHandler } from "@core/slot";
    import { Direction } from "@core/coord/direction";
    import { Registry } from "@core/registry";
    import { currentConnection } from "@core/multiplayer/connection";
    import Hotbar from "./Hotbar.svelte";

    let slotHandler = new SlotHandler(Registry.getSlots());

    export const selectedCell = slotHandler.currentCell;
    export const actualRotation = writable(0);
    export const rotation = derived(actualRotation, $r => ($r % 4 + 4) % 4 as Direction);
</script>

<script lang="ts">
    export let menuOpen: boolean;
    export let uiVisible: boolean;

    export let grid: CellGrid;

    on("F1").down(() => uiVisible = !uiVisible);
    on("F2").down(() => $config.showBackgroundGrid = !$config.showBackgroundGrid);
    on("q").when(() => !menuOpen).down(() => $actualRotation--);
    on("e").when(() => !menuOpen).down(() => $actualRotation++);
    on("t").when(() => !menuOpen).down(() => {
        levelPlaying = false;
        playTimer.stop();

        if (initial[0] && !grid.initial)
            grid = initial[0];

        if (currentConnection && currentConnection.isConnected)
            currentConnection.loadGrid();
    });
    // TODO: update
    // on("tab").down(() => keys.shift ? slotHandler.prev() : slotHandler.next());
    // on("<").down(() => slotHandler.loopSlot());
    on("g").when(() => !levelPlaying).down(() => {
        if (grid.initial) initial[0] = grid.clone();
        grid.doStep(false);
    });

    const playTimer = new Animator(() => {
        if (grid.initial) initial[0] = grid.clone();
        grid.doStep(false);
    });

    $: playTimer.setInterval($config.tickSpeed);

    let levelPlaying = false;
    on(" ").when(() => !menuOpen).down(() => {
        if (levelPlaying) playTimer.stop();
        else playTimer.start();
        levelPlaying = !levelPlaying;
    });

</script>

{#if uiVisible}
    <Hotbar slotHandler={slotHandler} rotation={$actualRotation} />
{/if}
