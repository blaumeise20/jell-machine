import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";

import { config } from "dotenv";
config();

const dev = process.env.NODE_ENV == "development";

app.on("ready", () => {
    const appPath = encodeURIComponent(
        JSON.stringify([
            dev
                ? join(
                      app.getPath("userData"),
                      require("../../package.json").productName
                  )
                : app.getPath("userData"),
            __dirname,
        ])
    );

    const window = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        fullscreen: true,
        titleBarStyle: "hidden",
    });

    if (dev)
        window.loadURL(
            `http://localhost:${
                process.env.ELECTRON_WEBPACK_DEV_PORT || 6357
            }/#${appPath}`
        );
    else
        window.loadURL(
            "file://" + join(__dirname, `../build/index.html#${appPath}`)
        );
});

app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("ERR", (_, data) => {
    console.log(data);
});
