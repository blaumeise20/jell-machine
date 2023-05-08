<script lang="ts">
    import CellGridViewer from "./CellGridViewer.svelte";
    import DebugMenu from "./DebugMenu.svelte";
    import GameControls from "./GameControls.svelte";
    import { cursorPosition, screenPosition, selection, selectionContent, showControls } from "../uiState";
    import Menu from "./Menu.svelte";
    import { on } from "../keys";
    import type { Stack } from "@utils/stack";
    import Overlay from "../Overlay.svelte";
    import Settings from "../settings/Settings.svelte";
    import type { GridProvider } from "../gridProvider/GridProvider";
    import type { CellType } from "@core/cells/cellType";
    import type { Direction } from "@core/cells/direction";
    import type { Readable, Writable } from "svelte/store";

    export let layers: Stack<string>;
    export let gridProvider: GridProvider;

    let menuOpen = false;
    let showSettings = false;

    let grid = gridProvider.grid;
    gridProvider.gridChanged = () => grid = gridProvider.grid;

    let selectedCell: Writable<CellType>;
    let rotation: Readable<Direction>;

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
        selectedCell={$selectedCell}
        rotation={$rotation}
    />
    <DebugMenu
        bind:gridProvider
        bind:visible={$showControls}
    />
    <GameControls
        bind:menuOpen
        bind:visible={$showControls}
        bind:gridProvider
        bind:selectedCell={selectedCell}
        bind:rotation={rotation}
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
