import type { CellGrid } from "@core/grid/cellGrid";
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
    const R = Math.PI * 2;

    // Draw grid
    const t_bg = tex.cells["bg"].getBitmap(0); // TODO
    const t_placeable = tex.cells["placeable"].getBitmap(0);
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
        if (tile == Tile.Placeable) {
            ctx.drawImage(
                t_placeable,
                Math.floor(hWidth + (pos.x - cx) * cellSize),
                Math.floor(hHeight - (pos.y - cy + 1) * cellSize),
                cellSize,
                cellSize,
            );
        }
    }

    // Draw cells
    let prevAngle = 0;
    ctx.save();
    for (let x = sx; x < ex; x++) {
        for (let y = sy; y < ey; y++) {
            const cell = grid.cells.getXY(x, y);
            if (cell) {
                const lx = lerp(cell.oldPosition.x, x, t);
                const ly = lerp(cell.oldPosition.y, y, t);
                const cellX = hWidth + (lx - cx) * cellSize + halfSize;
                const cellY = hHeight - (ly - cy + 1) * cellSize + halfSize;
                const angle = lerp(cell.direction - cell.rotationOffset, cell.direction, t) * halfPi % R;
                ctx.rotate((angle - prevAngle + R) % R);
                prevAngle = angle;
                const newX = cellX * Math.cos(R - angle) - cellY * Math.sin(R - angle) - halfSize;
                const newY = cellX * Math.sin(R - angle) + cellY * Math.cos(R - angle) - halfSize;
                ctx.drawImage(
                    tex.cells[cell.type.getTex(cell)].bitmap(cellSize),
                    newX,
                    newY,
                    cellSize,
                    cellSize,
                );
            }

            // check if there is a cell on the pasteboard
            if (pasteboard && pasteboardPos) {
                const pasteboardCell = pasteboard.cells.getXY(x - pasteboardPos.x, y - pasteboardPos.y);
                if (pasteboardCell) {
                    const cellX = hWidth + (x - cx) * cellSize + halfSize;
                    const cellY = hHeight - (y - cy + 1) * cellSize + halfSize;
                    const angle = pasteboardCell.direction * halfPi % R;
                    ctx.rotate((angle - prevAngle + R) % R);
                    prevAngle = angle;
                    const newX = cellX * Math.cos(R - angle) - cellY * Math.sin(R - angle) - halfSize;
                    const newY = cellX * Math.sin(R - angle) + cellY * Math.cos(R - angle) - halfSize;
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(
                        tex.cells[pasteboardCell.type.getTex(pasteboardCell)].bitmap(cellSize),
                        newX,
                        newY,
                        cellSize,
                        cellSize,
                    );
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    ctx.restore();

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
