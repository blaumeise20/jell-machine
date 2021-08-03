import { app, BrowserWindow } from "electron";
import { join } from "path";

const dev = process.env.NODE_ENV == "development";

app.on("ready", () => {
    const appPath = encodeURIComponent(JSON.stringify([
        dev ?
            join(app.getPath("userData"), require("../../package.json").productName) :
            app.getPath("userData"),
        app.getAppPath()
    ]));

	const window = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true
		},
		fullscreen: true,
		titleBarStyle: "hidden"
	});

    if (dev) window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_DEV_PORT}/#${appPath}`);
	else window.loadFile(`../build/index.html#${appPath}`);
});
