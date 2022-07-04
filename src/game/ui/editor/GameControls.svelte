<script lang="ts" context="module">
    import { writable, derived } from "svelte/store";
    import { on } from "../keys";
    import { selectionContent } from "../uiState";
    import { config } from "@utils/config";
    import { textures } from "@utils/texturePacks";
    import { CellGrid, initial } from "@core/cells/grid";
    import { Animator } from "@utils/animator";
    import { SlotHandler } from "@core/slot";
    import { Direction } from "@core/coord/direction";
    import { Registry } from "@core/registry";
    import UiElementViewer from "../UIElementViewer.svelte";
    import { block, button, text, UITextSize } from "@core/ui/build";
    import { structures } from "@utils/structures";
    import { currentConnection } from "@core/multiplayer/connection";

    let slotHandler = new SlotHandler(Registry.getSlots());
    const currentSlots = slotHandler.slots;

    export const selectedCell = slotHandler.currentCell;
    export const actualRotation = writable(0);
    export const rotation = derived(actualRotation, $r => ($r % 4 + 4) % 4 as Direction);

    const HOTBAR_SIZE = 50;
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

    let showStructures = false;

    const structureList = block(
        ...structures.map(s =>
            button(s.name, {
                onClick: () => {
                    $selectionContent = s.read();
                    showStructures = false;
                },
            })
        )
    );
    const structuresUI = block(
        text("Structures", { size: UITextSize.Large }),
        structureList,
        text("Save:"),
        button("Save Selection", {
            onClick: () => {

            },
        }),
    );
</script>

<style lang="scss">
    .bottom_controls {
        background-color: rgba(65, 65, 65, .7);
        bottom: 0;
        display: flex;
        position: fixed;
        width: 100%;
        z-index: 60;
    }

    $selection_size: var(--hotbar-size);

    .cells {
        flex: 1;
        display: flex;
        padding: calc($selection_size / 4) 0 calc($selection_size / 4) 0;
    }
    .cell_selection {
        background-repeat: no-repeat;
        background-size: contain;
        display: block;
        image-rendering: pixelated;
        position: relative;
        opacity: .4;
        margin-left: calc($selection_size / 4);
        transition: transform .15s, opacity .1s;
        width: $selection_size;
        height: $selection_size;
    }
    .selected {
        opacity: 1;
    }

    .structures {
        position: relative;
    }

    .structure_selection {
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center center;
        cursor: pointer;
        height: $selection_size;
        margin: 30px;
        width: $selection_size;
    }

    .structure_overlay {
        border: 1px solid #404040;
        background-color: #363636;
        bottom: 100%;
        color: #fff;
        padding: 10px;
        position: absolute;
        right: 30px;
        z-index: 10;
    }
</style>

{#if uiVisible}
    <div class="bottom_controls" style="--hotbar-size: {$config.uiScale * HOTBAR_SIZE}px;">
        <div class="cells">
            {#each $currentSlots as c, i}
                <div class="cell_selection" class:selected={c.isActive} style="
                    background-image: url({$textures.cells[c.currentItem.options.textureName].url});
                    transform: rotate({$actualRotation * 90}deg);
                " on:click={() => {
                    if (c.isActive)
                        slotHandler.loopSlot();
                    else
                        slotHandler.to(i);
                }}></div>
            {/each}
        </div>

        <div class="structures" style="display: none">
            <div class="structure_selection" style="
                background-image: url({$textures.ui["structures"].url});
            " on:click={() => showStructures = !showStructures}></div>

            <div class="structure_overlay" style="display: {showStructures ? "block" : "none"}">
                <UiElementViewer root={structuresUI} />
            </div>
        </div>
    </div>
{/if}
