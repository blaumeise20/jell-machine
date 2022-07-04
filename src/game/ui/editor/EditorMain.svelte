<script lang="ts">
	import { openLevel } from "@core/cells/grid";
    import CellGridViewer from "./CellGridViewer.svelte";
    import DebugMenu from "./DebugMenu.svelte";
    import GameControls from "./GameControls.svelte";
    import { cursorPosition, screenPosition, selection, selectionContent, showControls } from "../uiState";
    import Menu from "./Menu.svelte";
    import { on } from "../keys";
    import { Stack } from "@utils/stack";
    import Overlay from "../Overlay.svelte";
    import Settings from "../settings/Settings.svelte";

    export let visible: boolean;
    export let layers: Stack<string>;

    let menuOpen = false;
    let showSettings = false;

    on("escape").when(() => visible && $openLevel && !showSettings).down(() => menuOpen = !menuOpen);
    on("escape").when(() => visible && showSettings).down(() => showSettings = false);
</script>

<style lang="scss">
    .cell_controller {
        background-color: #272727;
        display: flex;
        height: 100%;
        width: 100%;
    }
</style>

{#if visible}
    <div class="cell_controller">
        {#if $openLevel}
            <CellGridViewer
                grid={$openLevel}
                showPlacable={$showControls}
                bind:selectionArea={$selection}
                bind:pasteboard={$selectionContent}
                bind:mousePosition={$cursorPosition}
                bind:center={$screenPosition}
            />
            <DebugMenu />
            <GameControls
                bind:menuOpen
                bind:uiVisible={$showControls}
                bind:grid={$openLevel}
            />
        {/if}
    </div>

    <Menu
        bind:open={menuOpen}
        bind:layers
        bind:showSettings
    />

    <Overlay visible={showSettings}>
        <Settings />
        <div class="space"></div>
        <button class="center" on:click={() => showSettings = false}>Back</button>
    </Overlay>
{/if}
