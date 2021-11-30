<script>
    import { Cell } from "@core/cells/cell";
    import { openLevel } from "@core/cells/grid";
    import { Direction } from "@core/coord/direction";
    import { Pos } from "@core/coord/positions";
    import { config } from "@utils/config";
    import { on } from "../keys";
    import { activeLayer, cursorPosition, screenPosition, selection } from "../uiState";

    on("f3").when(() => $activeLayer == "game").down(() => {
        $config.showDebug = !$config.showDebug;
    });

    let targetedCell: Cell | null = null;
    $: targetedCellPosition = Pos(Math.floor($cursorPosition.x), Math.floor($cursorPosition.y));
    $: if (!targetedCell?.pos.equals(targetedCellPosition)) targetedCell = $openLevel ? $openLevel.cells.get(targetedCellPosition) : null;
</script>

<style>
    .debug {
        font: 400 14px/17px "Menlo", monospace;
        color: #fff;
        position: absolute;
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

<div class="debug" style="display: {$config.showDebug ? "block" : "none"}">
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
            {targetedCell.debugText()}
        </div>
    {/if}
</div>
