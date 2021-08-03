import "./style.scss";
import "./polyfills";
import App from "./App.svelte";

const app = new App({
	target: document.body
});

export default app;
