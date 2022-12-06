import "./style.scss";
import "./polyfills";
import App from "./App.svelte";
import { Extension } from "@core/extensions";

const exts = import.meta.glob("./extensions/*.ts", { eager: true, import: "load" });
for (const path in exts) {
    const ext = exts[path];
    const name = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
    Extension.load(name, ext as () => void);
}

const app = new App({
	target: document.body
});

export default app;
