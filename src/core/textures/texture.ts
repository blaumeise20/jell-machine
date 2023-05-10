const resizeCanvas = document.createElement("canvas");
const resizeContext = resizeCanvas.getContext("2d")!;

export class Texture {
    private url: string;
    private bitmaps: ImageBitmap[];

    private constructor(url: string, bitmaps: ImageBitmap[]) {
        this.url = url;
        this.bitmaps = bitmaps;
    }

    public getBitmap(index: number) {
        return this.bitmaps[index];
    }

    public bitmap(size: number) {
        let i = this.bitmaps.length - 1;
        while (i > 0 && (size > this.bitmaps[i].width || size > this.bitmaps[i].height)) i--;
        return this.bitmaps[i];
    }

    toString() {
        return this.url;
    }

    valueOf() {
        return this.url;
    }

    static async fromBlob(blob: Blob, mipmapLevels = 3) {
        const url = URL.createObjectURL(blob);

        const original = await createImageBitmap(blob);
        const mipmaps = [original];
        let width = original.width;
        let height = original.height;
        for (let i = 0; i < mipmapLevels; i++) {
            width = Math.max(1, width >> 1);
            height = Math.max(1, height >> 1);
            resizeCanvas.width = width;
            resizeCanvas.height = height;
            resizeContext.drawImage(original, 0, 0, width, height);
            mipmaps.push(await createImageBitmap(resizeCanvas));
        }

        return new Texture(url, mipmaps);
    }
}
