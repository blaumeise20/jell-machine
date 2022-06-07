import { Cell } from "@core/cells/cell";
import { CellGrid, grid, openLevel } from "@core/cells/grid";
import { Pos } from "@core/coord/positions";
import { Events } from "@core/events";
import { Registry } from "@core/registry";
import { InputStream, OutputStream } from "./binaryIO";

export let currentConnection: MultiplayerConnection | null = null;

export function connect(url: string) {
    currentConnection = new MultiplayerConnection(url, grid!);
}

export function disconnect() {
    currentConnection?.disconnect();
}

export const onConnectionClose: [() => void] = [() => {}];

export class MultiplayerConnection {
    public readonly url: string;
    public readonly grid: CellGrid;
    public readonly version: string;
    public isConnected: boolean = false;

    private readonly socket: WebSocket;

    constructor(url: string, grid: CellGrid) {
        this.url = changeProtocol(url);
        this.grid = grid;
        this.version = "1";

        this.socket = new WebSocket(this.url, this.version);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onclose = this.onClose.bind(this);

        Events.on("cell-placed", this.onGridPlace);
        Events.on("cell-deleted", this.onGridDelete);
    }

    private onOpen(): void {
        console.log("Connected to server");
        this.isConnected = true;
    }

    private onMessage(event: MessageEvent): void {
        const inputStream = new InputStream(new Uint8Array(event.data));
        switch (inputStream.read_u8()) {
            case 0:
                console.log("shouldn't get this message");
                break;
            case 1:
                this.onGridReload(inputStream);
                break;
            case 2:
                this.onSet(inputStream);
                break;
        }
    }

    private onClose(): void {
        console.log("Disconnected from server");
        openLevel.set(null);
        this.isConnected = false;
        onConnectionClose[0]();
    }

    private onGridReload(inputStream: InputStream): void {
        const width = inputStream.read_u16()!;
        const height = inputStream.read_u16()!;
        this.grid.size.width = width;
        this.grid.size.height = height;
        inputStream.read_array(i => {
            const type = inputStream.read_string();
            const direction = inputStream.read_u8();
            if (type != "") {
                this.grid.loadCell(Pos(i % width, Math.floor(i / width)), Registry.getCell(type!)!, direction!);
            }
            else {
                this.grid.cells.get(Pos(i % width, Math.floor(i / width)))?.rm();
            }
            return true;
        });
        this.grid.reloadUI();
    }

    private onSet(inputStream: InputStream): void {
        if (!this.grid.initial) return;

        const x = inputStream.read_u16();
        const y = inputStream.read_u16();
        const type = inputStream.read_string();
        const direction = inputStream.read_u8();
        if (type == "") {
            this.grid.cells.get(Pos(x!, y!))?.rm();
        }
        else {
            this.grid.loadCell(Pos(x!, y!), Registry.getCell(type!)!, direction!);
        }
        this.grid.reloadUI();
    }

    private onGridSet = (cell: Cell, empty: boolean) => {
        if (!this.grid.initial) return;

        const outputStream = new OutputStream();
        outputStream.write_u8(2);
        outputStream.write_u16(cell.pos.x);
        outputStream.write_u16(cell.pos.y);
        outputStream.write_string(empty ? "" : cell.type.id);
        outputStream.write_u8(cell.direction);
        this.socket.send(outputStream.bytes);
    }

    private onGridPlace = (_: any, cell: Cell): void => {
        this.onGridSet(cell, false);
    }

    private onGridDelete = (_: any, cell: Cell): void => {
        this.onGridSet(cell, true);
    }

    public loadGrid() {
        const outputStream = new OutputStream();
        outputStream.write_u8(0);
        this.socket.send(outputStream.bytes);
    }

    public disconnect(): void {
        this.socket.close();
        Events.off("cell-placed", this.onGridPlace);
        Events.off("cell-deleted", this.onGridDelete);
        openLevel.set(null);
        onConnectionClose[0]();
    }
}

// if there is a ws(s) protocol, return the original url
// if there is a http(s) protocol, return the ws(s) protocol url
// otherwise replace optional other protocol with ws
function changeProtocol(url: string): string {
    const match = url.match(/^([a-z]+):\/\//);
    if (match) {
        const protocol = match[1];
        if (protocol === "ws" || protocol === "wss")
            return url;
        else if (protocol === "http" || protocol === "https")
            return url.replace(protocol, "ws");
    }
    return "ws://" + url.slice(match?.[0].length ?? 0);
}

// new MultiplayerConnection("localhost:3001");
