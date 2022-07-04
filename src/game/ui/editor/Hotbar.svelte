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
    const hotbarItems = slotHandler.slots;

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
        background-color: rgba(54, 54, 54, 0.8);
        border-top: 2px solid #404040;
        bottom: 0;
        display: flex;

        position: fixed;
        width: 100%;
        z-index: 60;
    }

    $item_size: var(--hotbar-item-size);
    $item_space: calc($item_size / 4.5);

    .hotbar_items {
        flex: 1;
        display: flex;
        padding: $item_space 0;

        .item_container {
            margin-left: $item_space;
            position: relative;
        }

        .item {
            background-repeat: no-repeat;
            background-size: contain;
            display: block;
            image-rendering: pixelated;
            position: relative;
            transition: transform .15s, opacity .1s;
            width: $item_size;
            height: $item_size;

            &:not(.selected) {
                opacity: .4;
            }
        }
        .submenu {
            bottom: calc(100% + $item_space + 10px);
            display: block;
            position: absolute;
            left: 50%;
            transform: translate(-50%, 0);

            .subitem {
                background-repeat: no-repeat;
                background-size: contain;
                display: block;
                image-rendering: pixelated;
                position: relative;
                margin-top: 7px;
                transition: transform .15s, opacity .1s;
                width: calc($item_size / 1.5);
                height: calc($item_size / 1.5);
            }
        }
    }

    .structures {
        position: relative;
    }

    .structure_selection {
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center center;
        cursor: pointer;
        height: $item_size;
        margin: 30px;
        width: $item_size;
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

<div class="hotbar" style="--hotbar-item-size: {$config.uiScale * HOTBAR_SIZE}px;">
    <div class="hotbar_items">
        {#each $hotbarItems as slot, index}
            <div class="item_container">
                <div
                    class="item"
                    class:selected={slot.isActive}
                    style="
                        background-image: url({$textures.cells[slot.currentItem.options.textureName].url});
                        transform: rotate({rotation * 90}deg);
                    "
                    on:click={() => {
                        slotHandler.to(index);
                        slotHandler.menu(false);
                    }}
                    on:contextmenu={() => {
                        slotHandler.to(index);
                        slotHandler.menu(true);
                    }}
                ></div>
                <div class="submenu" style="display: {slot.openMenu ? "block" : "none"}">
                    {#each slot.slot.items as cell, index}
                        <div
                            class="subitem"
                            style="
                                background-image: url({$textures.cells[cell.options.textureName].url});
                                transform: rotate({rotation * 90}deg);
                            "
                            on:click={() => slotHandler.toCell(index)}
                        ></div>
                    {/each}
                </div>
            </div>
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
