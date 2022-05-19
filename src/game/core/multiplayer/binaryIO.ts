export type Option<T> = T | undefined;

export class InputStream {
    public readonly bytes: Uint8Array;
    public index: number = 0;

    constructor(bytes: Uint8Array) {
        this.bytes = bytes;
    }

    public read_byte(): Option<number> {
        if (this.index === this.bytes.length) return undefined;
        else return this.bytes[this.index++];
    }

    public read_u8(): Option<number> {
        return this.read_byte();
    }

    public read_i8(): Option<number> {
        const b = this.read_u8();
        if (b === undefined) return undefined;
        else return b < 128 ? b : b - 256;
    }

    public read_u16(): Option<number> {
        const b1 = this.read_byte();
        const b0 = this.read_byte();
        if (b1 === undefined || b0 === undefined) return undefined;
        else return b0 + (b1 << 8);
    }

    public read_i16(): Option<number> {
        const b = this.read_u16();
        if (b === undefined) return undefined;
        return b < 32768 ? b : b - 65536;
    }

    public read_u32(): Option<number> {
        const b3 = this.read_byte();
        const b2 = this.read_byte();
        const b1 = this.read_byte();
        const b0 = this.read_byte();
        if (b3 === undefined || b2 === undefined || b1 === undefined || b0 === undefined) return undefined;
        else return b0 + (b1 << 8) + (b2 << 16) + (b3 << 24);
    }

    public read_i32(): Option<number> {
        const b = this.read_u32();
        if (b === undefined) return undefined;
        return b < 2147483648 ? b : b - 4294967296;
    }

    public read_string(maxSize = NaN): Option<string> {
        const length = this.read_u32();
        if (length === undefined || length > maxSize) return undefined;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            const b = this.read_byte();
            if (b === undefined) return undefined;
            bytes[i] = b;
        }
        return String.fromCharCode.apply(null, bytes as any);
    }

    public read_array<T>(read: (i: number) => Option<T>, maxSize = NaN): Option<T[]> {
        const length = this.read_u32();
        if (length === undefined || length > maxSize) return undefined;
        const array = new Array<T>(length);
        for (let i = 0; i < length; i++) {
            const value = read(i);
            if (value === undefined) return undefined;
            array[i] = value;
        }
        return array;
    }
}

export class OutputStream {
    public get bytes(): Uint8Array {
        return new Uint8Array(this.arr);
    }
    private arr: number[] = [];

    public write_byte(b: number): void {
        this.arr.push(b);
    }

    public write_u8(b: number): void {
        this.write_byte(b);
    }

    public write_i8(b: number): void {
        this.write_byte(b < 0 ? b + 256 : b);
    }

    public write_u16(b: number): void {
        this.write_byte(b >> 8);
        this.write_byte(b & 0xff);
    }

    public write_i16(b: number): void {
        this.write_u16(b < 0 ? b + 65536 : b);
    }

    public write_u32(b: number): void {
        this.write_byte(b >> 24 & 0xff);
        this.write_byte(b >> 16 & 0xff);
        this.write_byte(b >> 8 & 0xff);
        this.write_byte(b & 0xff);
    }

    public write_i32(b: number): void {
        this.write_u32(b < 0 ? b + 4294967296 : b);
    }

    public write_string(s: string): void {
        const bytes = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
            bytes[i] = s.charCodeAt(i);
        }
        this.write_u32(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            this.write_byte(bytes[i]);
        }
    }

    public write_array<T>(array: T[], write: (value: T) => void): void {
        this.write_u32(array.length);
        for (let i = 0; i < array.length; i++) {
            write(array[i]);
        }
    }
}
