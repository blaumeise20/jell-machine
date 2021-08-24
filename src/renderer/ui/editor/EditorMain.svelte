<script>
	// import { activeLevel, openLevel1, openLevel2 } from "@core/grid";
	import { openLevel } from "@core/grid";
    import CellGridViewer from "./CellGridViewer.svelte";
    import GameControls from "./GameControls.svelte";
    import { selection } from "../uiState";
    import Menu from "./Menu.svelte";

    // $openLevel = CellGrid.loadFromString("V3;1;1;e;;")[1] as CellGrid;
</script>

<style>
    .cell_controller {
        background-color: #2a2a2a;
        display: flex;
        height: 100%;
        width: 100%;
    }
    /* .seperator {
        background-color: #000;
        width: 10px;
    } */
</style>

<div class="cell_controller">
    {#if $openLevel}
        {#key $openLevel}
            <CellGridViewer grid={$openLevel} bind:selectionArea={$selection} />
        {/key}
    {/if}
    <!-- {#if $openLevel2}
        <div class="seperator"></div>
        <CellGridViewer level={$openLevel2} isEditable={$activeLevel == 2} />
    {/if} -->
    <GameControls />
</div>

<Menu />
