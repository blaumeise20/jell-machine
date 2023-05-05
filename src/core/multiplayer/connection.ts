import type { Cell } from "@core/grid/cell";
import type { CellGrid } from "@core/grid/cellGrid";
import { Pos, Position } from "@core/coord/positions";
import { Registry } from "@core/registry";
import { InputStream, OutputStream } from "./binaryIO";

export class MultiplayerConnection {
    public readonly url: string;
    public readonly grid: () => CellGrid;
    public readonly version: string;
    public isConnected: boolean = false;
    public sync: boolean = true;

    private readonly socket: WebSocket;

    constructor(url: string, grid: () => CellGrid) {
        this.url = changeProtocol(url);
        this.grid = grid;
        this.version = "1";

        this.socket = new WebSocket(this.url, this.version);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = this.socket_onOpen.bind(this);
        this.socket.onmessage = this.socket_onMessage.bind(this);
        this.socket.onclose = this.socket_onClose.bind(this);
    }

    public onConnected() {}
    public onGridLoaded() {}
    public onCellPlaced() {}

    private socket_onOpen(): void {
        this.isConnected = true;
        this.onConnected();
    }

    private socket_onMessage(event: MessageEvent): void {
        const inputStream = new InputStream(new Uint8Array(event.data));
        switch (inputStream.read_u8()) {
            case 0:
                console.error("shouldn't get this message", inputStream.bytes);
                break;
            case 1:
                this.msg_gridReload(inputStream);
                break;
            case 2:
                this.msg_setCell(inputStream);
                break;
        }
    }

    private socket_onClose(): void {
        this.isConnected = false;
    }

    private msg_gridReload(inputStream: InputStream): void {
        if (!this.sync) return;

        const grid = this.grid();
        const width = inputStream.read_u16()!;
        const height = inputStream.read_u16()!;
        grid.size.width = width;
        grid.size.height = height;
        inputStream.read_array(i => {
            const type = inputStream.read_string();
            const direction = inputStream.read_u8();
            if (type != "") {
                grid.loadCell(Pos(i % width, Math.floor(i / width)), Registry.getCell(type!)!, direction!);
            }
            else {
                grid.cells.get(Pos(i % width, Math.floor(i / width)))?.rm();
            }
            return true;
        });

        this.onGridLoaded();
    }

    private msg_setCell(inputStream: InputStream): void {
        if (!this.sync) return;

        const x = inputStream.read_u16();
        const y = inputStream.read_u16();
        const type = inputStream.read_string();
        const direction = inputStream.read_u8();
        if (type == "") {
            this.grid().cells.get(Pos(x!, y!))?.rm();
        }
        else {
            this.grid().loadCell(Pos(x!, y!), Registry.getCell(type!)!, direction!);
        }

        this.onCellPlaced();
    }

    public placeCell(pos: Position, cell: Cell | null) {
        if (!this.sync) return;

        const outputStream = new OutputStream();
        outputStream.write_u8(2);
        outputStream.write_u16(pos.x);
        outputStream.write_u16(pos.y);
        outputStream.write_string(cell ? cell.type.id : "");
        outputStream.write_u8(cell?.direction ?? 0);
        this.socket.send(outputStream.bytes);
    }

    public loadGrid() {
        const outputStream = new OutputStream();
        outputStream.write_u8(0);
        this.socket.send(outputStream.bytes);
    }

    public disconnect(): void {
        this.socket.close();
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
    return "wss://" + url.slice(match?.[0].length ?? 0);
}
