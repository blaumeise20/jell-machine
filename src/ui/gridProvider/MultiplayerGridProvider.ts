import type { Cell } from "@core/cells/cell";
import { CellGrid } from "@core/cells/grid";
import type { Position } from "@core/coord/positions";
import { MultiplayerConnection } from "@core/multiplayer/connection";
import type { Stack } from "@utils/stack";
import { GridProvider } from "./GridProvider";

export class MultiplayerGridProvider extends GridProvider {
    private connection: MultiplayerConnection;
    private connecting: boolean = false;
    private initial: CellGrid | null = null;
    private setState: (state: string | false) => void;
    private layers: () => Stack<string>;

    constructor(
        url: string,
        layers: () => Stack<string>,
        setState: (state: string | false) => void,
    ) {
        super(CellGrid.createEmpty(1, 1));
        this.layers = layers;
        this.setState = setState;

        setState("Connecting...");
        this.connection = new MultiplayerConnection(url, () => this.grid);
        this.connection.onConnected = this.onConnected.bind(this);
        this.connection.onGridLoaded = this.onGridLoaded.bind(this);
        this.connection.onCellPlaced = this.onCellPlaced.bind(this);
        this.connecting = true;
    }

    private onConnected() {
        this.setState("Loading grid...");
    }
    private onGridLoaded() {
        if (this.connecting) {
            this.connecting = false;
            this.setState(false);
            this.layers().replaceTop("editor");
        }
        this.gridChanged();
    }
    private onCellPlaced() {
        this.gridChanged();
    }

    public doStep(): void {
        this.connection.sync = false;
        if (!this.initial) {
            this.initial = this.grid.clone();
        }
        this.grid.doStep(false);
        this.prevUpdateTime = performance.now();
        this.gridChanged();
        this.isInitial.set(false);
    }

    public reset(): void {
        this.connection.sync = true;
        if (this.initial) {
            this.grid = this.initial;
            this.initial = null;
            this.gridChanged();
            this.connection.loadGrid();
            this.isInitial.set(true);
        }
    }

    public override cellPlaced(pos: Position, cell: Cell | null) {
        this.connection.placeCell(pos, cell);
    }

    public override destroy(): void {
        this.connection.disconnect();
    }
}
