import type { CellGrid } from "@core/cells/grid";
import { Direction } from "@core/coord/direction";
import type { Position } from "@core/coord/positions";
import type { Size } from "@core/coord/size";
import { Tile } from "@core/tiles";
import { currentTextures } from "@utils/texturePacks";

export function renderGrid(
    ctx: CanvasRenderingContext2D,
    bgMap: CanvasPattern,
    grid: CellGrid,
    _zoom: number,
    cellSize: number,
    gridCenter: { x: number; y: number },
    selection: Size | null,
    pasteboard: CellGrid | null,
    pasteboardPos: Position | null,
    t: number,
) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const hWidth = Math.floor(ctx.canvas.width / 2);
    const hHeight = Math.floor(ctx.canvas.height / 2);
    const cx = gridCenter.x;
    const cy = gridCenter.y;
    const tex = currentTextures;
    const sx = clamp(0, Math.floor(cx + (0 - hWidth) / cellSize), grid.size.width);
    const sy = clamp(0, Math.floor(cy - (hHeight) / cellSize), grid.size.height);
    const ex = clamp(0, Math.ceil(cx + (hWidth) / cellSize), grid.size.width);
    const ey = clamp(0, Math.ceil(cy - (0 - hHeight) / cellSize), grid.size.height);
    const halfSize = cellSize / 2;
    const halfPi = Math.PI / 2;

    // Draw grid
    const t_bg = tex.cells["bg"].bitmap;
    const t_placable = tex.cells["placable"].bitmap;
    const x = Math.floor(hWidth + (sx - cx) * cellSize);
    const y = Math.floor(hHeight - (ey - cy) * cellSize);
    bgMap.setTransform({
        a: cellSize / t_bg.width,
        d: cellSize / t_bg.height,
    });
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = bgMap;
    ctx.fillRect(
        0,
        0,
        Math.ceil(hWidth + (ex - cx) * cellSize) - x,
        Math.ceil(hHeight - (sy - cy) * cellSize) - y,
    );
    ctx.restore();
    for (const [pos, tile] of grid.tiles.entries()) {
        if (tile == Tile.Placable) {
            ctx.drawImage(
                t_placable,
                Math.floor(hWidth + (pos.x - cx) * cellSize),
                Math.floor(hHeight - (pos.y - cy + 1) * cellSize),
                cellSize,
                cellSize,
            );
        }
    }

    // Draw cells
    for (let x = sx; x < ex; x++) {
        for (let y = sy; y < ey; y++) {
            const cell = grid.cells.getXY(x, y);
            if (cell) {
                const lx = lerp(cell.oldPosition.x, x, t);
                const ly = lerp(cell.oldPosition.y, y, t);
                const cellX = hWidth + (lx - cx) * cellSize;
                const cellY = hHeight - (ly - cy + 1) * cellSize;
                const centerX = cellX + halfSize;
                const centerY = cellY + halfSize;
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(lerp(cell.direction - cell.rotationOffset, cell.direction, t) * halfPi);
                ctx.translate(-centerX, -centerY);
                ctx.drawImage(
                    tex.cells[cell.type.getTex(cell)].bitmap,
                    cellX,
                    cellY,
                    cellSize,
                    cellSize,
                );
                ctx.restore();
            }


            // check if there is a cell on the pasteboard
            if (pasteboard && pasteboardPos) {
                const pasteboardCell = pasteboard.cells.getXY(x - pasteboardPos.x, y - pasteboardPos.y);
                if (pasteboardCell) {
                    const cellX = hWidth + (x - cx) * cellSize;
                    const cellY = hHeight - (y - cy + 1) * cellSize;
                    const centerX = cellX + halfSize;
                    const centerY = cellY + halfSize;
                    ctx.save();
                    if (pasteboardCell.direction != Direction.Right) {
                        ctx.translate(centerX, centerY);
                        ctx.rotate(pasteboardCell.direction * halfPi);
                        ctx.translate(-centerX, -centerY);
                    }
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(
                        tex.cells[pasteboardCell.type.getTex(pasteboardCell)].bitmap,
                        cellX,
                        cellY,
                        cellSize,
                        cellSize,
                    );
                    ctx.restore();
                }
            }
        }
    }

    // Optionally draw selection
    if (selection) {
        const selectionX = hWidth + (selection.left - cx) * cellSize;
        const selectionY = hHeight - (selection.bottom - cy) * cellSize;
        ctx.fillStyle = "rgba(255,255,255, .2)";
        ctx.fillRect(selectionX, selectionY, selection.width * cellSize, -selection.height * cellSize);

        const border = cellSize / 10;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = border;
        ctx.strokeRect(selectionX, selectionY, selection.width * cellSize, -selection.height * cellSize);
    }
}

function clamp(min: number, value: number, max: number) {
    return value < min ? min : value > max ? max : value;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
