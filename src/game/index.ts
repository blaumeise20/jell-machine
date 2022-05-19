import "./style.scss";
import "./polyfills";
import App from "./App.svelte";
import "@core/multiplayer/connection";

const app = new App({
	target: document.body
});

export default app;
