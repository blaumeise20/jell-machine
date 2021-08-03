const { sveltePreprocess } = require("svelte-preprocess/dist/autoProcess");

module.exports = {
    preprocess: sveltePreprocess({
        defaults: {
            script: "typescript",
            style: "scss",
        },
        typescript: {
            tsconfigFile: "./tsconfig.json"
        },
        scss: {
            sourceMap: true,
            includePaths: ["src/style"],
            indentWidth: 4
        },
        sourceMap: true
    }),
};
