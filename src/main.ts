import "./style.scss";

(async () => {
    const { App, loadingPromises } = await import("./app");
    await Promise.all(loadingPromises);

    document.getElementById("loader")!.remove();
    new App({
        target: document.body,
    });
})();

export {};
