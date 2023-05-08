<script lang="ts">
    import type { Cell } from "@core/cells/cell";
    import { Direction } from "@core/direction";
    import { Pos } from "@core/coord/positions";
    import { config } from "@utils/config";
    import type { GridProvider } from "../gridProvider/GridProvider";
    import { on } from "../keys";
    import { cursorPosition, screenPosition, selection } from "../uiState";

    export let gridProvider: GridProvider;
    export let visible: boolean;
    const initial = gridProvider.isInitial;

    on("f3").down(() => $config.showDebug = !$config.showDebug);

    let targetedCell: Cell | null = null;
    $: targetedCellPosition = Pos(Math.floor($cursorPosition.x), Math.floor($cursorPosition.y));
    $: if (!targetedCell?.pos.equals(targetedCellPosition)) {
        targetedCell = gridProvider.grid.cells.get(targetedCellPosition);
    }
</script>

<style lang="scss">
    .debug {
        font: 400 14px/17px "Menlo", monospace;
        color: #fff;
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 100;

        div {
            margin-bottom: 10px;

            &::before {
                content: attr(data-label);
                display: block;
                text-decoration: underline;
            }
        }
    }
</style>

{#if $config.showDebug && visible}
    <div class="debug">
        <div data-label="General">
            Level size: {gridProvider.grid.size.width}&times;{gridProvider.grid.size.height}<br />
            Initial: <span style:color={$initial ? null : "#f44"}>{$initial}</span>
        </div>
        <div data-label="Screen position">
            Cursor: {$cursorPosition.x.toFixed(3)} {$cursorPosition.y.toFixed(3)}<br />
            Screen center: {$screenPosition.x.toFixed(3)} {$screenPosition.y.toFixed(3)}
        </div>
        {#if $selection}
            <div data-label="Selected Area">
                Width: {$selection.width}<br />
                Height: {$selection.height}<br />
            </div>
        {/if}
        {#if targetedCell}
            <div data-label="Targeted Cell">
                Position: {targetedCell.pos.x} {targetedCell.pos.y}<br />
                Type: {targetedCell.type.id}<br />
                Direction: {Direction[targetedCell.direction]}<br />
                {targetedCell.type.options.debugText?.(targetedCell) ?? ""}
            </div>
        {/if}
    </div>
{/if}
