import { Cell } from "@core/cells/cell";
import { CellType } from "@core/cells/cellType";
import { UpdateType } from "@core/cells/cellUpdates";
import { Off } from "@core/coord/positions";
// import { Slot } from "@core/slot";
import arr from "create-arr";

const PORT = 8080;

export function load() {
    const networkMover = CellType.create({
        id: "jm.network.network_mover",
        name: "Network Mover",
        description: "too hard to explain :skull:",
        behavior: class NetworkCell extends Cell {
            private doAction(action: Action) {
                switch (action.type) {
                    case "move":
                        this.push(action.dir ?? this.direction, 1);
                        break;
                    case "rotate":
                        this.grid.setRotation(this.pos, action.dir ?? (this.direction + (action.amount ?? 1)) & 3);
                        break;
                    case "generate":
                        break;
                    case "delete":
                        this.grid.cells.get(this.pos.mi(Off[this.direction]))?.rm();
                        break;
                }
            }
            override update() {
                const requestData = {
                    tickCount: this.grid.tickCount,
                    pos: this.pos,
                    dir: this.direction,
                    grid: arr(5, y => arr(5, x => {
                        const pos = this.pos.mi(x - 2, y - 2);
                        if (!this.grid.size.contains(pos)) return { x, y, type: "_", dir: 0 };

                        const cell = this.grid.cells.get(pos);
                        if (!cell) return null;

                        return {
                            x,
                            y,
                            type: cell.type.id,
                            dir: cell.direction,
                        };
                    })),
                };

                let response: Actions;
                try {
                    response = httpGet(`http://localhost:${PORT}/`, JSON.stringify(requestData));
                }
                catch {
                    return;
                }

                if (Array.isArray(response)) response.forEach(this.doAction.bind(this));
                else this.doAction(response);
            }
        },
        textureName: "network",

        updateType: UpdateType.Directional,
        updateOrder: 3.1,
    });

    networkMover;
    // Slot.add(networkMover); TODO: explanation
}

function httpGet(url: string, dataHeader: string): any {
    const req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.setRequestHeader("Cell-Data", dataHeader);
    req.send();

    return JSON.parse(req.responseText);
}

type Actions = Action | Action[];
type Action = MoveAction | RotateAction | GenerateAction | DeleteAction;

type MoveAction = {
    type: "move",
    dir?: number,
};

type RotateAction = {
    type: "rotate",
    dir?: number,
    amount?: number,
};

type GenerateAction = {
    type: "generate",
    id: string,
    dir: number,
};

type DeleteAction = {
    type: "delete",
};
