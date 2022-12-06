<script lang="ts">
    import { Direction } from "@core/coord/direction";
    import type { CellGrid } from "@core/cells/grid";
    import { onMount } from "svelte";
    import { Tile } from "@core/tiles";
    import { keys, modifiers, on } from "../keys";
    import { mouse } from "@utils/mouse";
    import { Off, Pos, toPos } from "@core/coord/positions";
    import { Size } from "@core/coord/size";
    import type { GridProvider } from "../gridProvider/GridProvider";
    import { clipboard } from "../uiState";
    import { renderGrid } from "./render";
    import { currentTextures } from "@utils/texturePacks";
    import { config } from "@utils/config";
    import type { CellType } from "@core/cells/cellType";

    export let grid: CellGrid;
    export let gridProvider: GridProvider;
    if (grid.isInfinite) throw new Error("OH NO");

    export let selectedCell: CellType;
    export let rotation: Direction;

    const CELL_SIZE = 64;
    const CELLS_PER_SECOND = 8;
    const ZOOM_SPEED = 150;
    const MAX_ZOOM = 4;
    const DISPLAY_RATIO = window.devicePixelRatio;

    export const center = { x: grid.size.width / 2, y: grid.size.height / 2 };
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

    // camera: undo
    on("z").and(modifiers.cmdOrCtrl).down(() => {
        gridProvider.undo();
    });

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
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let bgTextureMap: CanvasPattern;
    $: if (canvas) {
        ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";

        const bg = currentTextures.cells["bg"].bitmap;
        const temp = document.createElement("canvas");
        temp.width = bg.width;
        temp.height = bg.height;
        const tempCtx = temp.getContext("2d")!;
        tempCtx.drawImage(bg, 0, 0);
        bgTextureMap = ctx.createPattern(temp, "repeat")!;
    }
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
        let offset = CELLS_PER_SECOND / zoom * (delta / 1000);
        if ($config.keyboardOnly) offset = offset / 1.5;
        if (moving.up || moving2.up) y += offset;
        if (moving.right || moving2.right) x += offset;
        if (moving.down || moving2.down) y -= offset;
        if (moving.left || moving2.left) x -= offset;

        // camera: placing calculations
        const mouseX = $config.keyboardOnly ? editorSize.width / 2 : mouse.x;
        const mouseY = $config.keyboardOnly ? editorSize.height / 2 : mouse.y;
        const pixelDistX = mouseX - editorSize.width / 2;
        const pixelDistY = mouseY - editorSize.height / 2;
        const cellDistX = pixelDistX / CELL_SIZE / zoom;
        const cellDistY = pixelDistY / CELL_SIZE / zoom;
        const cellX = center.x + cellDistX;
        const cellY = center.y - cellDistY;
        const actualX = Math.floor(cellX);
        const actualY = Math.floor(cellY);
        const clickedCell = Pos(actualX, actualY);
        if (mouseButton != -1) {
            mouseCurrent.x = actualX;
            mouseCurrent.y = actualY;
        }

        // camera: placing
        if (placeCell) {
            if (mouseButton == 0 || placingKeys.o) {
                if (keys.shift) grid.tiles.set(clickedCell, Tile.Placable);
                else gridProvider.placeCell(clickedCell, selectedCell, rotation);
            }
            else if (mouseButton == 2 || placingKeys.p) {
                if (keys.shift) grid.tiles.delete(clickedCell);
                else gridProvider.placeCell(clickedCell, null);
            }
        }

        // camera: zooming
        if (zoomingKeys.u) {
            zoom = zoom / (1 + (ZOOM_SPEED/delta) / ZOOM_SPEED);
        }
        else if (zoomingKeys.j) {
            zoom = zoom * (1 + (ZOOM_SPEED/delta) / ZOOM_SPEED);
        }

        // rendering
        renderGrid(
            ctx,
            bgTextureMap,
            grid,
            zoom,
            CELL_SIZE * zoom * DISPLAY_RATIO,
            center,
            showSelectionBox ? Size.from(toPos(mouseAnchor), toPos(mouseCurrent)) : null,
            pasteboard,
            selectionPos,
            gridProvider.getAnimationPercent(),
        );

        // camera: set new coordinates
        center.x = x;
        center.y = y;
        mousePosition.x = cellX;
        mousePosition.y = cellY;
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

    const tabKey = on("tab").observe();

    // selection clipboard: cut/copy/paste
    on("x").and(modifiers.cmdOrCtrl).when(() => showSelectionBox).down(() => {
        $clipboard = grid.cloneArea(selectionSize);
        gridProvider.clearArea(selectionSize);
        gridProvider.undoStack.finish();
        showSelectionBox = false;
        placeCell = true;
    });
    on("c").and(modifiers.cmdOrCtrl).down(() => {
        $clipboard = grid.cloneArea(selectionSize);
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
            gridProvider.moveArea(selectionSize, dir);
            gridProvider.undoStack.finish();
            const offset = Off[dir];
            mouseAnchor.x += offset.x;
            mouseAnchor.y += offset.y;
            mouseCurrent.x += offset.x;
            mouseCurrent.y += offset.y;
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
    const zoomingKeys = { u: false, j: false };
    on("u").when(() => $config.keyboardOnly).observe(zoomingKeys, "u");
    on("j").when(() => $config.keyboardOnly).observe(zoomingKeys, "j");

    // camera: placing/inserting
    function mousedownEvent(e: MouseEvent) {
        if (mouseButton != -1) return;

        if (pasteboard) {
            if (e.button != 2) {
                gridProvider.insertArea(selectionPos, pasteboard, keys.ctrl);
                gridProvider.undoStack.finish();
            }
            pasteboard = null;
            placeCell = false;
        }
        else {
            mouseButton = e.button;
            mouseAnchor.x = Math.floor(mousePosition.x);
            mouseAnchor.y = Math.floor(mousePosition.y);
            showSelectionBox = $tabKey;
            if (showSelectionBox) placeCell = false;
        }
    }
    function mouseupEvent(_e: MouseEvent) {
        mouseButton = -1;
        if (placeCell) gridProvider.undoStack.finish();
        placeCell = !showSelectionBox;
    }
    const placingKeys = { o: false, p: false };
    on("o").when(() => $config.keyboardOnly).observe(placingKeys, "o");
    on("p").when(() => $config.keyboardOnly).observe(placingKeys, "p");
</script>

<style lang="scss">
    .cell_editor {
        flex: 1;
        overflow: hidden;
        position: relative;
        z-index: 50;

        canvas {
            width: 100%;
            height: 100%;
        }

        .crosshair {
            height: 0;
            left: 50%;
            position: absolute;
            top: 50%;
            width: 0;
            transform: scale(var(--ui-scale));

            &::before {
                background: #fff;
                content: "";
                height: 2px;
                left: -10px;
                position: absolute;
                top: -1px;
                width: 20px;
            }
            &::after {
                background: #fff;
                content: "";
                height: 20px;
                left: -1px;
                position: absolute;
                top: -10px;
                width: 2px;
            }
        }
    }
</style>

<div class="cell_editor" style="--ui-scale: {$config.uiScale * 100}%" bind:this={editorElement} on:wheel={zoomEvent} on:mousedown={mousedownEvent} on:mouseup={mouseupEvent}>
    <canvas
        bind:this={canvas}
        width={editorSize.width * DISPLAY_RATIO}
        height={editorSize.height * DISPLAY_RATIO}
    ></canvas>
    {#if $config.keyboardOnly}
        <div class="crosshair"></div>
    {/if}
</div>
