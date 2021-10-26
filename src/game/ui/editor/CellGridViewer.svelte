<script>
    import { Direction } from "@core/cell";
    import { CellGrid } from "@core/grid";
    import { currentPack } from "@utils/texturePacks";
    import { onMount, onDestroy } from "svelte";
    import { moving, showControls } from "../uiState";
    import { Tile } from "@core/tiles";
    import { keys, keys$, on } from "../keys";
    import { mouse } from "@utils/mouse";
    import { Pos, Position } from "@utils/positions";
    import { rotation, selectedCell } from "./GameControls.svelte";
    import { Size } from "@utils/size";
    import { config } from "@utils/config";

    export let grid: CellGrid;
    if (grid.isInfinite) throw new Error("OH NO");

    const CELL_SIZE = 64;
    const CELLS_PER_SECOND = 8;
    const ZOOM_SPEED = 150;
    const MAX_ZOOM = 4;

    let editorElement: HTMLDivElement;
    const editorSize = { width: 0, height: 0 };
    const center = { x: grid.size.width / 2, y: grid.size.height / 2 }
    const gridOffset = { left: 0, bottom: 0 };
    const mouseCell = { x: 0, y: 0 };
    let zoom = 1;
    let mouseButton = -1;

    $: if (editorElement) {
        editorSize.width  = editorElement.offsetWidth;
        editorSize.height = editorElement.offsetHeight;

        gridOffset.left   = editorSize.width  / 2 - center.x * CELL_SIZE;
        gridOffset.bottom = editorElement.offsetHeight / 2 - center.y * CELL_SIZE;
    }

    grid.reloadUI(() => grid = grid);

    //#region frames

    let living = false;
    let previousTime = 0;
    const updateFrame = (time: number) => {
        if (!previousTime) previousTime = time;

        // moving
        let x = center.x;
        let y = center.y;

        const offset = CELLS_PER_SECOND / zoom * ((time - previousTime) / 1000);

        if (moving.up) y += offset;
        if (moving.right) x += offset;
        if (moving.down) y -= offset;
        if (moving.left) x -= offset;
        // moving end

        // placing
        const pixelDistX = mouse.x - editorSize.width / 2;
        const pixelDistY = mouse.y - editorSize.height / 2;
        const cellDistX = pixelDistX / CELL_SIZE / zoom;
        const cellDistY = pixelDistY / CELL_SIZE / zoom;
        const cellX = center.x + cellDistX;
        const cellY = center.y - cellDistY;
        const actualX = Math.floor(cellX);
        const actualY = Math.floor(cellY);
        const clickedCell = Pos(actualX, actualY);

        let cellChanged = false;
        if (mouseButton == 0) {
            if (selecting) {
                if (!showSelection) selectionStart = clickedCell.c();
                showSelection = true;
                selectionCurrent = clickedCell.c();
            }
            else if (placeCell) {
                if (keys.shift) grid.tiles.set(clickedCell, Tile.Placable);
                else grid.loadCell(clickedCell, $selectedCell, $rotation);
            }

            cellChanged = true;
        }
        else if (mouseButton == 2) {
            if (keys.shift) grid.tiles.delete(clickedCell);
            else grid.cells.get(clickedCell)?.rm();

            cellChanged = true;
        }
        // placing end

        center.x = x;
        center.y = y;
        mouseCell.x = cellX;
        mouseCell.y = cellY;
        if (cellChanged) grid = grid;
        previousTime = time;
        if (living) frame = requestAnimationFrame(updateFrame);
    }
    let frame = requestAnimationFrame(updateFrame);

    onMount(() => living = true);
    onDestroy(() => (living = false, cancelAnimationFrame(frame)));

    //#endregion frames

    //#region selection
    let selectionStart: Position | null = null;
    let selectionCurrent: Position | null = null;
    let selecting = false;
    let showSelection = false;
    let placeCell = true;
    $: selectionSize = Size.from(selectionStart, selectionCurrent)!;

    export let selectionArea: Size | null = null;
    $: selectionArea = showSelection ? selectionSize : null;
    $: grid.selectedArea = showSelection ? selectionSize : null;

    let selection: CellGrid | null = null;
    $: selectionPos = selection ? Pos(
        Math.round(mouseCell.x - selection.size.width / 2),
        Math.round(mouseCell.y - selection.size.height / 2)
    ) : Pos(0, 0);
    let lastSelection: CellGrid | null = selection;
    $: if (selection) lastSelection = selection;

    on("x").down(() => {
        if (showSelection) selection = grid.extract(selectionSize, true), showSelection = false;
    });
    on("c").down(() => {
        if (showSelection) selection = grid.extract(selectionSize), showSelection = false;
    });

    on("v").when(() => lastSelection && !selection).down(() => {
        selection = lastSelection;
    });

    on("q").when(() => selection).down(() => {
        selection = selection!.rotateCCW();
    });
    on("e").when(() => selection).down(() => {
        selection = selection!.rotateCW();
    });

    on("r").when(() => selection).down(() => {
        selection = selection!.flipVertical();
    });
    on("f").when(() => selection).down(() => {
        selection = selection!.flipHorizontal();
    });

    on("arrowright").down(() => {
        if (showSelection) {
            grid.move(selectionSize, Direction.Right);
            selectionStart = selectionStart!.mi(Direction.Right);
            selectionCurrent = selectionCurrent!.mi(Direction.Right);
        }
    });
    on("arrowdown").down(() => {
        if (showSelection) {
            grid.move(selectionSize, Direction.Down);
            selectionStart = selectionStart!.mi(Direction.Down);
            selectionCurrent = selectionCurrent!.mi(Direction.Down);
        }
    });
    on("arrowleft").down(() => {
        if (showSelection) {
            grid.move(selectionSize, Direction.Left);
            selectionStart = selectionStart!.mi(Direction.Left);
            selectionCurrent = selectionCurrent!.mi(Direction.Left);
        }
    });
    on("arrowup").down(() => {
        if (showSelection) {
            grid.move(selectionSize, Direction.Up);
            selectionStart = selectionStart!.mi(Direction.Up);
            selectionCurrent = selectionCurrent!.mi(Direction.Up);
        }
    });

    on("g").down(() => {
        if (keys.shift) {
            grid.fillTile(selectionSize, Tile.Placable);
        }
        else {
            grid.fillCell(selectionSize, $selectedCell, $rotation);
        }
    });
    //#endregion


    //#region events

    function zoomEvent(e: WheelEvent) {
        const d = e.deltaY;
        if (d == 0 || d == -0) return;

        // zoom = e.deltaY;
        if (Math.abs(d) != d) {
            // negative
            zoom = zoom * (1 + Math.abs(d) / ZOOM_SPEED);
        }
        else {
            // positive
            zoom = zoom / (1 + Math.abs(d) / ZOOM_SPEED);
        }
        zoom = Math.min(zoom, MAX_ZOOM);
    }

    function mousedownEvent(e: MouseEvent) {
        if (selection) {
            if (e.button != 2) grid.insert(selection, selectionPos, keys.ctrl);
            selection = null;
            placeCell = false;
        }
        else {
            mouseButton = e.button;
            if (mouseButton == 2 && showSelection) grid.clear(selectionSize);
            selecting = keys.ctrl;
            showSelection = false;
        }
    }
    function mouseupEvent(e: MouseEvent) {
        mouseButton = -1;
        selecting = false;
        placeCell = !showSelection;
    }

    //#endregion

/*

V3;a;a;0123456789a;lol;
V3;b;4;iokmsqwyu}{AGCEKIOQM}{SYUW%!.?+}{0624a8egc}{;;
V3;b;4;iolmsqwyu}{AGCELJPQM}{TYVW&$=?+}{0624a8egc}{;;
first level: V3;1q;1q;{(0(OL)6)03{(0(1g)6)04{)03666{(0(1b)666{)0a666{(0(17)66{)052)04{)03666{(0(15)6{)04222{)0322{)0366{(0(13)66{)0322{)062{)0466{(0(12)6{)0322{)0822{)036{(0(12)6{)032{)0a2{)036{(0(11)66{{{2{)0b22{{{66{(0(10)6{{{22{)0c2{)036{)0}66{{{2{)0i66{)0{6{)0o6{)0{6{)0o6{)0{6{)0o6{)0{6{)05aaa{)05aaa{)066{)0{6{)04a)04{)03a)04{)0466{)0{66{)03a)04{)03a)04{)046{(0(10)6{)03a)04{)03a)04{)0366{(0(10)6{)04aaa{)05aaa{)046{(0(11)66{)0j66{(0(12)6{)0i66{(0(13)666{)0e666{(0(16)66{)0b666{(0(19)6)04{)05666{(0(1f)6)07{(0(P^);;

V3;1q;1q;{(0(Vr)a)06{(0(1g)aaa{)05aaa{(0(1c)a{)0baa{(0(19)aa{)042)03{)04a{(0(17)aa{)0422{{222{)03a{(0(16)a{)042{)0522{)03aa{(0(14)a{)032{)072{)04a{(0(14)a{{{2{)092{)03a{(0(14)a{)0d2{)03a{(0(14)a{)0ia{(0(14)a{)0ia{(0(14)a{)0ia{(0(1a)ee{)04ee{)04a{(0(15)a{)03ee{)04ee{)04a{(0(16)a{)0faa{(0(17)a{)0ea{(0(19)aa{)0aaa{(0(1b)aa{)08aa{(0(1e)a)09{(0(Rj);;

*/
</script>

<style>
    $CELL_SIZE: 64px;

    .cell_editor {
        flex: 1;
        overflow: hidden;
        position: relative;
        z-index: 50;
    }
    .container {
        height: 0;
        position: absolute;
        width: 0;
    }

    .background {
        background-color: #2A2A2A;
        background-size: $CELL_SIZE $CELL_SIZE;
        background-repeat: repeat;
        bottom: 0;
        position: absolute;
    }

    .cell_container {
        bottom: 0;
        left: 0;
        position: absolute;
        shape-rendering: optimizeSpeed;

        &.animate .cell.animate {
            transition-duration: var(--transition-duration);
            transition-timing-function: linear;
            transition-property: transform, x, y;
        }
    }
    .cell {
        height: $CELL_SIZE;
        width: $CELL_SIZE;
        transform-box: fill-box;
        transform-origin: center center;
    }

    .show_placable .cell:not(.placable) {
        opacity: .5;
    }

    .selection_box {
        background-color: rgba(255,255,255, .2);
        border-style: solid;
        border-color: #fff;
        position: absolute;
    }
</style>

<div class="cell_editor" class:show_placable={$keys$.shift && $showControls} bind:this={editorElement} on:wheel={zoomEvent} on:mousedown={mousedownEvent} on:mouseup={mouseupEvent}>
    <div class="container" style="
        bottom: {gridOffset.bottom}px;
        left: {gridOffset.left}px;
        transform: scale({zoom});
        transform-origin: {editorSize.width / 2 - gridOffset.left}px {-(editorSize.height / 2 - gridOffset.bottom)}px;
        --transition-duration: {$config.tickSpeed}ms;
    " class:animate={$config.animation}>
        <div class="background" style="
            width: {grid.size.width * CELL_SIZE}px;
            height: {grid.size.height * CELL_SIZE}px;
            background-image: url({$currentPack.textures.bg.url});
        "></div>
        <svg class="cell_container" width={grid.size.width * CELL_SIZE} height={grid.size.height * CELL_SIZE}>
            {#each [...grid.tiles.entries()] as [pos, tile]}
                <image
                    class="cell placable placable_bg"
                    x={CELL_SIZE * pos.x}
                    y={CELL_SIZE * (grid.size.height - pos.y - 1)}
                    href={$currentPack.textures.placable.url}
                />
            {/each}
            {#each [...grid.cells.values()] as cell (cell.id)}
                <image
                    class="cell animate"
                    class:placable={grid.tiles.get(cell.pos) == Tile.Placable}
                    x={CELL_SIZE * cell.pos.x}
                    y={CELL_SIZE * (grid.size.height - cell.pos.y - 1)}
                    href={$currentPack.textures[cell.type.options.textureName].url}
                    transform="rotate({cell.direction * 90})"
                />
            {/each}
        </svg>
        {#if selection}
            <svg class="cell_container" style="opacity: .7; bottom: {Math.round(selectionPos.y) * CELL_SIZE}px; left: {Math.round(selectionPos.x) * CELL_SIZE}px;" width={selection.size.width * CELL_SIZE} height={selection.size.height * CELL_SIZE}>
                <!-- {#each [...selection.tiles.entries()] as [pos, tile]}
                    <image
                        class="cell placable placable_bg"
                        x={CELL_SIZE * pos.x}
                        y={CELL_SIZE * (selection.size.height - pos.y - 1)}
                        href={$currentPack.textures.placable.url}
                    />
                {/each} -->
                {#each [...selection.cells.values()] as cell}
                    <image
                        class="cell"
                        x={CELL_SIZE * cell.pos.x}
                        y={CELL_SIZE * (selection.size.height - cell.pos.y - 1)}
                        href={$currentPack.textures[cell.type.options.textureName].url}
                        transform="rotate({cell.direction * 90})"
                    />
                {/each}
            </svg>
        {/if}

        {#if showSelection}
            <div class="selection_box" style="
                bottom: {CELL_SIZE * selectionSize.bottom}px;
                left: {CELL_SIZE * selectionSize.left}px;
                width: {CELL_SIZE * selectionSize.width}px;
                height: {CELL_SIZE * selectionSize.height}px;

                border-width: {CELL_SIZE / 16 * Math.max(.5, Math.min(1 / zoom, 3))}px;
            "></div>
        {/if}
    </div>
</div>
