<script context="module">
    import { writable, derived } from "svelte/store";
    import { CellType, cellTypes } from "@core/cell";
    import { openLevel } from "@core/grid";
    import { rotateBy } from "@utils/misc";
    import { currentPack } from "@utils/texturePacks";

    export const selectedCell = writable(CellType.Generator);
    export const actualRotation = writable(0);
    export const rotation = derived(actualRotation, $r => rotateBy($r));
</script>

<script>
    import { on } from "../keys";
    import { importLevel, menuOpen, showControls } from "../uiState";

    let show = true;
    on("F1").when(() => !$importLevel).down(() => (show = !show, showControls.set(show), $menuOpen = false));
    on("q").when(() => !$menuOpen && !$importLevel).down(() => $actualRotation--);
    on("e").when(() => !$menuOpen && !$importLevel).down(() => $actualRotation++);

    let levelPlaying = false;
    let waiting = false;
    function toggleLevel() {
        if (levelPlaying) {
            levelPlaying = false;
        }
        else {
            levelPlaying = true;
            if (!waiting) doStep();
            levelPlaying = false;
        }
    }
    function doStep() {
        // waiting = true;
        $openLevel?.doStep();
        // setTimeout(() => {
        //     waiting = false;
        //     if (levelPlaying) doStep();
        // }, $config.tickSpeed);
    }
</script>

<style>
    .bottom_controls {
        background-color: rgba(65, 65, 65, .7);
        bottom: 0;
        display: flex;
        position: fixed;
        width: 100%;
        z-index: 60;
    }

    .buttons {
        padding: 30px 100px 30px 30px;
    }
    .play {
        background-size: 100px 100px;
        background-repeat: no-repeat;
        width: 100px;
        height: 100px;
    }

    .cells {
        flex: 1;
        display: flex;
        padding: 30px;
    }

    $selection_size: 100px;
    .cell_selection_seperator {
        flex: 1;
    }
    .cell_selection {
        background-repeat: no-repeat;
        background-size: $selection_size $selection_size;
        height: $selection_size;
        opacity: .4;
        transition: transform .15s, opacity .1s;
        width: $selection_size;
    }
    .selected {
        opacity: 1;
    }
</style>

{#if show}
    <div class="bottom_controls">
        <div class="buttons">
            <div class="play" style="background-image: url({$currentPack.ui[levelPlaying ? "pause" : "play"].url})" on:click={() => toggleLevel()}></div>
        </div>

        <div class="cells">
            {#each cellTypes as c, i}
                {#if i}
                    <div class="cell_selection_seperator"></div>
                {/if}
                <div class="cell_selection" class:selected={$selectedCell == c[0]} style="
                    background-image: url({$currentPack.textures[c[1]].url});
                    transform: rotate({$actualRotation * 90}deg);
                " on:click={() => $selectedCell = c[0]}></div>
            {/each}
        </div>
    </div>

    <!-- cells/tools -->
{/if}
