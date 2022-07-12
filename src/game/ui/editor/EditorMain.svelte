<script lang="ts">
    import CellGridViewer from "./CellGridViewer.svelte";
    import DebugMenu from "./DebugMenu.svelte";
    import GameControls from "./GameControls.svelte";
    import { cursorPosition, screenPosition, selection, selectionContent, showControls } from "../uiState";
    import Menu from "./Menu.svelte";
    import { on } from "../keys";
    import { Stack } from "@utils/stack";
    import Overlay from "../Overlay.svelte";
    import Settings from "../settings/Settings.svelte";
    import { GridProvider } from "../gridProvider/GridProvider";

    export let layers: Stack<string>;
    export let gridProvider: GridProvider;

    let menuOpen = false;
    let showSettings = false;

    let grid = gridProvider.grid;
    gridProvider.gridChanged = () => grid = gridProvider.grid;

    on("escape").when(() => !showSettings).down(() => menuOpen = !menuOpen);
    on("escape").when(() => showSettings).down(() => showSettings = false);
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
    <CellGridViewer
        {grid}
        bind:gridProvider
        bind:selectionArea={$selection}
        bind:pasteboard={$selectionContent}
        bind:mousePosition={$cursorPosition}
        bind:center={$screenPosition}
    />
    <DebugMenu bind:gridProvider />
    <GameControls
        bind:menuOpen
        bind:uiVisible={$showControls}
        bind:gridProvider
    />
</div>

<Menu
    bind:open={menuOpen}
    bind:layers
    bind:showSettings
    bind:gridProvider
/>

<Overlay visible={showSettings}>
    <Settings />
    <div class="space"></div>
    <button class="center" on:click={() => showSettings = false}>Back</button>
</Overlay>
