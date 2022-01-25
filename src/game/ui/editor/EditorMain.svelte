<script lang="ts">
	import { openLevel } from "@core/cells/grid";
    import CellGridViewer from "./CellGridViewer.svelte";
    import DebugMenu from "./DebugMenu.svelte";
    import GameControls from "./GameControls.svelte";
    import { cursorPosition, screenPosition, selection, selectionContent } from "../uiState";
    import Menu from "./Menu.svelte";

    // $openLevel = CellGrid.loadFromString("V3;1;1;e;;")[1] as CellGrid;
</script>

<style lang="scss">
    .cell_controller {
        background-color: #272727;
        display: flex;
        height: 100%;
        width: 100%;
    }
</style>

<div class="cell_controller">
    {#if $openLevel}
        {#key $openLevel}
            <CellGridViewer grid={$openLevel} bind:selectionArea={$selection} bind:selection={$selectionContent} bind:mouseCell={$cursorPosition} bind:center={$screenPosition} />
        {/key}
    {/if}
    <DebugMenu />
    <GameControls />
</div>

<Menu />
