<script lang="ts">
    import { writable, derived } from "svelte/store";
    import { on } from "../keys";
    import { config } from "@utils/config";
    import { Animator } from "@utils/animator";
    import { SlotHandler } from "@core/slot";
    import type { Direction } from "@core/direction";
    import { Registry } from "@core/registry";
    import Hotbar from "./Hotbar.svelte";
    import type { GridProvider } from "../gridProvider/GridProvider";

    export let menuOpen: boolean;
    export let visible: boolean;

    export let gridProvider: GridProvider;

    let slotHandler = new SlotHandler(Registry.getSlots());

    export const selectedCell = slotHandler.currentCell;
    export const actualRotation = writable(0);
    export const rotation = derived(actualRotation, $r => ($r % 4 + 4) % 4 as Direction);

    on("F1").down(() => visible = !visible);
    on("F2").down(() => $config.showBackgroundGrid = !$config.showBackgroundGrid);
    on("q").when(() => !menuOpen).down(() => $actualRotation--);
    on("e").when(() => !menuOpen).down(() => $actualRotation++);
    on("t").when(() => !menuOpen).down(() => {
        levelPlaying = false;
        playTimer.stop();
        gridProvider.reset();
    });
    // TODO: update
    // on("tab").down(() => keys.shift ? slotHandler.prev() : slotHandler.next());
    // on("<").down(() => slotHandler.loopSlot());
    on("g").when(() => !levelPlaying).down(() => gridProvider.doStep());

    const playTimer = new Animator(() => gridProvider.doStep());
    $: playTimer.setInterval($config.tickSpeed);

    let levelPlaying = false;
    on(" ").when(() => !menuOpen).down(() => {
        if (levelPlaying) playTimer.stop();
        else playTimer.start();
        levelPlaying = !levelPlaying;
    });

</script>

{#if visible}
    <Hotbar slotHandler={slotHandler} rotation={$actualRotation} />
{/if}
