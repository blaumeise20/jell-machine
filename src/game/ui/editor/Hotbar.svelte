<script lang="ts">
    import { SlotHandler } from "@core/slot";
    import { block, button, text, UITextSize } from "@core/ui/build";
    import { config } from "@utils/config";
    import { structures } from "@utils/structures";
    import { textures } from "@utils/texturePacks";
    import UiElementViewer from "../UIElementViewer.svelte";

    export let slotHandler: SlotHandler;
    export let rotation: number;

    const HOTBAR_SIZE = 50;
    const currentSlots = slotHandler.slots;

    let showStructures = false;

    const structureList = block(
        ...structures.map(s =>
            button(s.name, {
                onClick: () => {
                    // $selectionContent = s.read();
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
    .hotbar {
        backdrop-filter: blur(10px);
        background-color: rgba(64, 64, 64, 0.8);
        border-top: 2px solid #585858;
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

<div class="hotbar" style="--hotbar-size: {$config.uiScale * HOTBAR_SIZE}px;">
    <div class="cells">
        {#each $currentSlots as c, i}
            <div class="cell_selection" class:selected={c.isActive} style="
                background-image: url({$textures.cells[c.currentItem.options.textureName].url});
                transform: rotate({rotation * 90}deg);
            " on:click={() => {
                if (c.isActive)
                    slotHandler.loopSlot();
                else
                    slotHandler.to(i);
            }}></div>
        {/each}
    </div>
    <div class="current_cell">

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
