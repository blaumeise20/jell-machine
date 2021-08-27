<script context="module">
    import { writable, derived } from "svelte/store";
    import { CellType, cellTypes } from "@core/cell";
    import { rotateBy } from "@utils/misc";

    export const selectedCell = writable(CellType.Generator);
    export const actualRotation = writable(0);
    export const rotation = derived(actualRotation, $r => rotateBy($r));
</script>

<script>
    import { on } from "../keys";
    import { importLevel, menuOpen, showControls } from "../uiState";
    import { config } from "@utils/config";
    import { openLevel } from "@core/grid";
    import { currentPack } from "@utils/texturePacks";
    import { Animator } from "@utils/animator";

    let show = true;
    on("F1").when(() => !$importLevel).down(() => (show = !show, showControls.set(show), $menuOpen = false));
    on("q").when(() => !$menuOpen && !$importLevel).down(() => $actualRotation--);
    on("e").when(() => !$menuOpen && !$importLevel).down(() => $actualRotation++);

    const playTimer = new Animator(() => {
        $openLevel?.doStep();
    });

    $: playTimer.setInterval($config.tickSpeed);

    let levelPlaying = false;
    function toggleLevel() {
        if (levelPlaying) {
            playTimer.stop();
            levelPlaying = false;
        }
        else {
            playTimer.start();
            levelPlaying = true;
        }
    }
    on(" ").when(() => !$menuOpen && !$importLevel).down(toggleLevel);

    let cellsInBar = [...cellTypes];
    on("1").down(() => $selectedCell = cellsInBar[0][0]);
    on("2").down(() => $selectedCell = cellsInBar[1][0]);
    on("3").down(() => $selectedCell = cellsInBar[2][0]);
    on("4").down(() => $selectedCell = cellsInBar[3][0]);
    on("5").down(() => $selectedCell = cellsInBar[4][0]);
    on("6").down(() => $selectedCell = cellsInBar[5][0]);
    on("7").down(() => $selectedCell = cellsInBar[6][0]);
    on("8").down(() => $selectedCell = cellsInBar[7][0]);
    on("9").down(() => $selectedCell = cellsInBar[8][0]);
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
