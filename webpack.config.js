const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { rmdirSync, existsSync, mkdirSync } = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config();

const prod = process.env.NODE_ENV == "production";

if (existsSync("./src/build")) rmdirSync("./src/build", { recursive: true });

mkdirSync("./src/build");

/** @type {webpack.Configuration} */
module.exports = {
    mode: prod ? "production" : "development",
    target: "electron-renderer",
    entry: {
        main: {
            import: ["./src/game/index.ts"],
            filename: "main.[contenthash].js",
        },
    },
    devtool: prod ? "source-map" : "inline-source-map",
    devServer: {
        port: process.env.ELECTRON_WEBPACK_DEV_PORT || 6357,
        contentBase: "./src/build",
    },
    output: {
        path: path.resolve(__dirname, "src/build"),
    },
    module: {
        rules: [
            {
                test: /\.ts?x?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.webpack.json",
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.svelte$/,
                use: {
                    loader: "svelte-loader",
                    options: {
                        preprocess: require("./svelte.config").preprocess,
                        sourceMap: !prod,
                        emitCss: true,
                    },
                },
            },
            {
                test: /\.scss$/,
                use: [
                    !prod ? "style-loader" : MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: !prod,
                        },
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [require("autoprefixer")()],
                                sourceMap: !prod,
                            },
                            sourceMap: !prod,
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: !prod,
                            sassOptions: {
                                sourceMap: !prod,
                                resolve: {
                                    alias: {
                                        style: "./src/style/",
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    !prod ? "style-loader" : MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: !prod,
                        },
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                sourceMap: !prod,
                                plugins: [require("autoprefixer")()],
                            },
                            sourceMap: !prod,
                        },
                    },
                ],
            },
            {
                test: /\.(woff2?|png|svg|jpe?g)$/,
                loader: "file-loader",
                options: {
                    outputPath: "static",
                },
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
            chunkFilename: "[name].[contenthash].css",
        }),
        new HtmlWebpackPlugin({
            template: "./src/public/index.html",
        }),
        new webpack.ExternalsPlugin("commonjs", [
            "electron",
            "@electron/remote",
            "path",
            "fs",
        ]),
    ],
    resolve: {
        extensions: [".ts", ".js", ".tsx", ".svelte"],
        alias: {
            "@core": path.resolve(__dirname, "./src/game/core/"),
            "@utils": path.resolve(__dirname, "./src/game/utils/"),
        },
    },
    node: {
        __dirname: false,
    },
};
