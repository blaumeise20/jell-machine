import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readFileSync } from "fs";

export default defineConfig({
    plugins: [
        {
            name: "blob-loader",
            transform(code, id) {
                if (!id.match(/(\?|&)blob/)) return null;

                const path = id.replace(/\?.*$/, "");
                const data = readFileSync(path).toString("base64");

                let mime: string;
                if (path.endsWith(".png")) mime = "image/png";
                else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) mime = "image/jpeg";
                else if (path.endsWith(".gif")) mime = "image/gif";
                else if (path.endsWith(".svg")) mime = "image/svg+xml";
                else mime = "text/plain";

                return `import decode from "/src/utils/decodeBase64.ts"; export default new Blob([decode("${data}")], { type: "${mime}" });`;
            }
        },
        svelte(),
    ],
    clearScreen: false,
    server: {
        strictPort: true,
    },
    envPrefix: ["VITE_", "TAURI_"],
    build: {
        target: ["esnext"],
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        sourcemap: !!process.env.TAURI_DEBUG,
    },
    resolve: {
        alias: {
            "@core": "/src/core",
            "@utils": "/src/utils",
        }
    }
});
