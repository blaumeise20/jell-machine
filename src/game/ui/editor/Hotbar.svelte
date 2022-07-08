<script lang="ts">
    import { CellType } from "@core/cells/cellType";
    import { SlotHandler } from "@core/slot";
    import { block, button, text, UITextSize } from "@core/ui/build";
    import { config } from "@utils/config";
    import FormattedText from "@utils/FormattedText.svelte";
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

    let cellInfo: { cell: CellType, top: number, left: number } | null = null;

    function setCellInfo(element: any, cell: CellType) {
        const box = element.getBoundingClientRect();
        const top = box.top;
        const left = box.left + box.width + 10;

        cellInfo = {
            cell,
            top,
            left,
        };
    }
</script>

<style lang="scss">
    .hotbar {
        bottom: 0;
        display: flex;
        position: fixed;
        width: 100%;
        z-index: 60;
    }

    $item_size: var(--hotbar-item-size);
    $item_space: calc($item_size / 4.5);

    // items

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

    // structures

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
        bottom: 100%;
        color: #fff;
        padding: 10px;
        position: absolute;
        right: 30px;
        z-index: 10;
    }

    // cell information

    .cell_info {
        padding: 10px;
        position: fixed;
        z-index: 63;

        h3 {
            font: 400 22px/25px "Roboto", sans-serif;
            margin: 0;
            padding: 0;
        }
        p {
            font: 400 17px/20px "Roboto", sans-serif;
            margin: 10px 0 0 0;
        }
        p.small {
            font: 400 15px/17px "Roboto", sans-serif;
            margin: 5px 0 0 0;
        }
    }
</style>

<div class="hotbar box box-soft box-top" style="--hotbar-item-size: {$config.uiScale * HOTBAR_SIZE}px;">
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
                    on:mouseenter={e => setCellInfo(e.target, slot.currentItem)}
                    on:mouseleave={() => cellInfo = null}
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
                            on:mouseenter={e => setCellInfo(e.target, cell)}
                            on:mouseleave={() => cellInfo = null}
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

        <div class="structure_overlay box" style="display: {showStructures ? "block" : "none"}">
            <UiElementViewer root={structuresUI} />
        </div>
    </div>
</div>

{#if cellInfo}
    <div class="cell_info box box-medium" style:top="{cellInfo.top}px" style:left="{cellInfo.left}px">
        <h3><FormattedText text={cellInfo.cell.options.name} /></h3>
        {#if $config.showDebug}
            <p class="small">ID: {cellInfo.cell.id}</p>
        {/if}
        {#if cellInfo.cell.options.description}
            <p><FormattedText text={cellInfo.cell.options.description} /></p>
        {/if}
    </div>
{/if}
