<script lang="ts">
    import { Direction } from "@core/coord/direction";
    import { CellGrid } from "@core/cells/grid";
    import { textures } from "@utils/texturePacks";
    import { onMount } from "svelte";
    import { Tile } from "@core/tiles";
    import { keys, keys$, modifiers, on } from "../keys";
    import { mouse } from "@utils/mouse";
    import { Off, Pos, toPos } from "@core/coord/positions";
    import { rotation, selectedCell } from "./GameControls.svelte";
    import { Size } from "@core/coord/size";
    import { config } from "@utils/config";
    import { Events } from "@core/events";
    import { GridProvider } from "../gridProvider/GridProvider";
    import { Cell } from "@core/cells/cell";
    import { clipboard } from "../uiState";

    export let grid: CellGrid;
    export let gridProvider: GridProvider;
    if (grid.isInfinite) throw new Error("OH NO");

    export let showPlacable: boolean;

    const CELL_SIZE = 64;
    const CELLS_PER_SECOND = 8;
    const ZOOM_SPEED = 150;
    const MAX_ZOOM = 4;

    export const center = { x: grid.size.width / 2, y: grid.size.height / 2 }
    export const mousePosition = { x: 0, y: 0 };
    export const mouseAnchor = { x: NaN, y: NaN };
    export const mouseCurrent = { x: 0, y: 0 };
    const editorSize = { width: 0, height: 0 };
    const gridOffset = { left: 0, bottom: 0 };
    let zoom = 1;
    let mouseButton = -1;

    // camera: move keys
    const moving = {
        up: false,
        right: false,
        down: false,
        left: false,
    };
    const moving2 = {
        up: false,
        right: false,
        down: false,
        left: false,
    };
    addMoveKey("w", "arrowup", "up");
    addMoveKey("a", "arrowleft", "left");
    addMoveKey("s", "arrowdown", "down");
    addMoveKey("d", "arrowright", "right");
    function addMoveKey(k: string, k2: string, p: keyof typeof moving) {
        on(k).down(() => moving[p] = true).up(() => moving[p] = false);
        on(k2).down(() => moving2[p] = true).up(() => moving2[p] = false);
    }

    // camera: size
    let editorElement: HTMLDivElement;
    $: if (editorElement) {
        editorSize.width  = editorElement.offsetWidth;
        editorSize.height = editorElement.offsetHeight;
        gridOffset.left   = editorSize.width  / 2 - center.x * CELL_SIZE;
        gridOffset.bottom = editorSize.height / 2 - center.y * CELL_SIZE;
    }

    // camera: frames
    let living = true, previousTime = 0;
    let frame: number;
    onMount(() => {
        previousTime = performance.now();
        frame = requestAnimationFrame(updateFrame);
        return () => (living = false, cancelAnimationFrame(frame));
    });
    const updateFrame = (time: number) => {
        const delta = time - previousTime;
        previousTime = time;
        if (living) frame = requestAnimationFrame(updateFrame);

        // camera: move calculations
        let x = center.x;
        let y = center.y;
        const offset = CELLS_PER_SECOND / zoom * (delta / 1000);
        if (moving.up || moving2.up) y += offset;
        if (moving.right || moving2.right) x += offset;
        if (moving.down || moving2.down) y -= offset;
        if (moving.left || moving2.left) x -= offset;

        // camera: placing calculations
        const pixelDistX = mouse.x - editorSize.width / 2;
        const pixelDistY = mouse.y - editorSize.height / 2;
        const cellDistX = pixelDistX / CELL_SIZE / zoom;
        const cellDistY = pixelDistY / CELL_SIZE / zoom;
        const cellX = center.x + cellDistX;
        const cellY = center.y - cellDistY;
        const actualX = Math.floor(cellX);
        const actualY = Math.floor(cellY);
        const clickedCell = Pos(actualX, actualY);

        // camera: placing
        let cellChanged = false;
        if (placeCell) {
            if (mouseButton == 0) {
                if (keys.shift) {
                    grid.tiles.set(clickedCell, Tile.Placable);
                    cellChanged = true;
                }
                else {
                    const originalCell = grid.cells.get(clickedCell);
                    if (!originalCell || originalCell.type != $selectedCell || originalCell.direction != $rotation) {
                        if (grid.isInfinite || grid.size.contains(clickedCell)) {
                            const cell = grid.loadCell(clickedCell, $selectedCell, $rotation)!;
                            Events.emit("cell-placed", clickedCell, cell);
                            gridProvider.cellPlaced(clickedCell, cell as Cell);
                            cellChanged = true;
                        }
                    }
                }
            }
            else if (mouseButton == 2) {
                if (keys.shift) grid.tiles.delete(clickedCell);
                else {
                    const cell = grid.cells.get(clickedCell);
                    if (cell) {
                        cell.rm();
                        Events.emit("cell-deleted", clickedCell, cell);
                        gridProvider.cellPlaced(clickedCell, null);
                    }
                }

                cellChanged = true;
            }
        }

        // camera: set new coordinates
        center.x = x;
        center.y = y;
        mousePosition.x = cellX;
        mousePosition.y = cellY;
        if (mouseButton != -1) {
            mouseCurrent.x = actualX;
            mouseCurrent.y = actualY;
        }
        if (cellChanged) grid = grid;
    }

    // selection: calculations
    let showSelectionBox = false;
    let placeCell = true;
    $: selectionSize = Size.from(toPos(mouseAnchor), toPos(mouseCurrent))!;

    export let selectionArea: Size | null = null;
    $: selectionArea = showSelectionBox ? selectionSize : null;
    $: grid.selectedArea = selectionArea;

    export let pasteboard: CellGrid | null = null;
    $: selectionPos = pasteboard ? Pos(
        Math.round(mousePosition.x - pasteboard.size.width / 2),
        Math.round(mousePosition.y - pasteboard.size.height / 2)
    ) : Pos(0, 0);

    // selection clipboard: cut/copy/paste
    on("x").and(modifiers.cmdOrCtrl).when(() => showSelectionBox).down(() => {
        $clipboard = grid.extract(selectionSize, true); grid = grid; // TODO: multiplayer
        showSelectionBox = false;
        placeCell = true;
    });
    on("c").and(modifiers.cmdOrCtrl).down(() => {
        $clipboard = grid.extract(selectionSize); grid = grid; // TODO: multiplayer
        showSelectionBox = false;
        placeCell = true;
    });
    on("v").and(modifiers.cmdOrCtrl).when(() => clipboard && !pasteboard).down(() => {
        pasteboard = $clipboard;
    });

    // selection pasteboard: rotate/flip
    on("q").when(() => pasteboard).down(() => pasteboard = pasteboard!.rotateCCW());
    on("e").when(() => pasteboard).down(() => pasteboard = pasteboard!.rotateCW());
    on("r").when(() => pasteboard).down(() => pasteboard = pasteboard!.flipVertical());
    on("f").when(() => pasteboard).down(() => pasteboard = pasteboard!.flipHorizontal());

    // selection: move
    for (const [key, dir] of [
        ["arrowright", Direction.Right],
        ["arrowdown", Direction.Down],
        ["arrowleft", Direction.Left],
        ["arrowup", Direction.Up],
    ] as const) {
        on(key).and(modifiers.alt).when(() => showSelectionBox).down(() => {
            grid.move(selectionSize, dir); // TODO: multiplayer
            const offset = Off[dir];
            mouseAnchor.x += offset.x;
            mouseAnchor.y += offset.y;
            mouseCurrent.x += offset.x;
            mouseCurrent.y += offset.y;
            grid = grid;
        });
    }

    // selection: fill
    // on("g").down(() => {
    //     if (keys.shift) grid.fillTile(selectionSize, Tile.Placable);
    //     else grid.fillCell(selectionSize, $selectedCell, $rotation);
    // });

    // camera: zoom
    function zoomEvent(e: WheelEvent) {
        const d = e.deltaY;
        if (d == 0 || d == -0) return;

        if (d > 0) {
            // positive
            zoom = zoom / (1 + Math.abs(d) / ZOOM_SPEED);
        }
        else {
            // negative
            zoom = zoom * (1 + Math.abs(d) / ZOOM_SPEED);
        }
        zoom = Math.min(zoom, MAX_ZOOM);
    }

    // camera: placing/inserting
    function mousedownEvent(e: MouseEvent) {
        if (mouseButton != -1) return;

        if (pasteboard) {
            if (e.button != 2) {
                for (const cell of pasteboard.cells.values()) {
                    const newPos = Pos(cell.pos.x + selectionPos.x, cell.pos.y + selectionPos.y);
                    const cellAt = grid.cells.get(newPos);
                    let newCell: Cell | false;
                    if (cellAt && keys.ctrl) {
                        const newData = cellAt.type.merge(cellAt, cell);
                        newCell = grid.loadCell(newPos, newData[0], newData[1]);
                    }
                    else {
                        newCell = grid.loadCell(cell.pos.mi(selectionPos), cell.type, cell.direction);
                    }
                    if (newCell) {
                        Events.emit("cell-placed", cell.pos, newCell);
                        gridProvider.cellPlaced(newPos, newCell);
                    }
                }
                grid = grid;
            }
            pasteboard = null;
            placeCell = false;
        }
        else {
            mouseButton = e.button;
            mouseAnchor.x = Math.floor(mousePosition.x);
            mouseAnchor.y = Math.floor(mousePosition.y);
            showSelectionBox = keys.ctrl;
            if (showSelectionBox) placeCell = false;
        }
    }
    function mouseupEvent(_e: MouseEvent) {
        mouseButton = -1;
        placeCell = !showSelectionBox;
    }
</script>

<style lang="scss">
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

        &.animate .cell.animate {
            transition-duration: var(--transition-duration);
            transition-timing-function: linear;
            transition-property: transform, x, y;
        }
    }

    .background {
        background-color: #2A2A2A;
        background-size: $CELL_SIZE $CELL_SIZE;
        background-repeat: repeat;
        bottom: 0;
        image-rendering: pixelated;
        position: absolute;
    }

    .cell_container {
        bottom: 0;
        left: 0;
        position: absolute;
        shape-rendering: optimizeSpeed;
    }
    .cell {
        height: $CELL_SIZE;
        width: $CELL_SIZE;
        transform-box: fill-box;
        transform-origin: center center;
        image-rendering: pixelated;
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

<div class="cell_editor" class:show_placable={$keys$.shift && showPlacable} bind:this={editorElement} on:wheel={zoomEvent} on:mousedown={mousedownEvent} on:mouseup={mouseupEvent}>
    <div class="container" style="
        bottom: {gridOffset.bottom}px;
        left: {gridOffset.left}px;
        transform: scale({zoom});
        transform-origin: {editorSize.width / 2 - gridOffset.left}px {-(editorSize.height / 2 - gridOffset.bottom)}px;
        --transition-duration: {$config.tickSpeed}ms;
    " class:animate={$config.animation}>
        <!-- grid -->
        <div class="background" style="
            width: {grid.size.width * CELL_SIZE}px;
            height: {grid.size.height * CELL_SIZE}px;
            background-image: url({$textures.cells.bg.url});
            display: {$config.showBackgroundGrid ? "block" : "none"};
        "></div>

        <!-- cells -->
        <svg class="cell_container" width={grid.size.width * CELL_SIZE} height={grid.size.height * CELL_SIZE}>
            {#each [...grid.tiles.entries()] as [pos, _]}
                <image
                    class="cell placable placable_bg"
                    x={CELL_SIZE * pos.x}
                    y={CELL_SIZE * (grid.size.height - pos.y - 1)}
                    href={$textures.cells.placable.url}
                />
            {/each}
            {#each [...grid.cells.values()] as cell (cell.id)}
                <image
                    class="cell animate"
                    class:placable={grid.tiles.get(cell.pos) == Tile.Placable}
                    x={CELL_SIZE * cell.pos.x}
                    y={CELL_SIZE * (grid.size.height - cell.pos.y - 1)}
                    href={$textures.cells[cell.type.getTex(cell)].url}
                    transform="rotate({cell.direction * 90})"
                />
            {/each}
        </svg>

        <!-- selection clipboard -->
        {#if pasteboard}
            <svg class="cell_container" style="opacity: .7; bottom: {Math.round(selectionPos.y) * CELL_SIZE}px; left: {Math.round(selectionPos.x) * CELL_SIZE}px;" width={pasteboard.size.width * CELL_SIZE} height={pasteboard.size.height * CELL_SIZE}>
                <!-- {#each [...selection.tiles.entries()] as [pos, tile]}
                    <image
                        class="cell placable placable_bg"
                        x={CELL_SIZE * pos.x}
                        y={CELL_SIZE * (selection.size.height - pos.y - 1)}
                        href={$currentPack.textures.placable.url}
                    />
                {/each} -->
                {#each [...pasteboard.cells.values()] as cell}
                    <image
                        class="cell"
                        x={CELL_SIZE * cell.pos.x}
                        y={CELL_SIZE * (pasteboard.size.height - cell.pos.y - 1)}
                        href={$textures.cells[cell.type.getTex(cell)].url}
                        transform="rotate({cell.direction * 90})"
                    />
                {/each}
            </svg>
        {/if}

        <!-- selection -->
        {#if showSelectionBox}
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
