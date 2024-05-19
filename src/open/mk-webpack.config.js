const path = require("path")
const fs = require("fs")
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const webpack = require("webpack")
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin

// rootDir: contains node_modules
// buildDir: output of build
// opts: { alias: alias map, publicPath }
function makeConfig(entry, rootDir, buildDir, opts) {
    return {
        target: ['web', 'es5'],
        experiments: {
            outputModule: true,
        },
        entry: {
            index: entry,
        },
        output: {
            filename: "open.js",
            path: buildDir,
            publicPath: opts?.publicPath ? opts?.publicPath : '/build',
            library: {
                type: 'module'
            }
        },
        module: {
            rules: [
                {
                    test: /\.html$/,
                    use: ["file?name=[name].[ext]"],
                },
                {
                    test: /\.tsx?$/,
                    // exclude: /(node_modules)/,
                    // exclude: /node_modules\/(?!(code-lens-support-login)\/).*/,
                    use: {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                        },
                    },
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /(node_modules)/, // too much files if commented out, making it too slow
                    resolve: {
                        extensions: [".tsx", ".ts", ".js", ".jsx"],
                    },

                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-react"],
                        },
                    },
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.less$/i,
                    use: [
                        // compiles Less to CSS
                        "style-loader",
                        "css-loader",
                        {
                            loader: "less-loader",
                            options: {
                                lessOptions: {
                                    javascriptEnabled: true,
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.svg$/i,
                    issuer: /\.[jt]sx?$/,
                    use: ["@svgr/webpack"],
                },
                {
                    test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                    use: {
                        loader: "file-loader",
                        options: {
                            outputPath: "assets",
                        },
                    },
                },
                {
                    test: /\.(jpe?g|png|gif)$/i,
                    use: "file-loader?name=/img/[name].[ext]",
                },
            ],
        },
        resolve: {
            alias: {
                ...opts?.alias,
            },
            extensions: [".tsx", ".ts", "jsx", ".js"],
            fallback: {
                // util: require.resolve("util/"),
                crypto: require.resolve("crypto-browserify"),
                stream: false,
            },
        },
        plugins: [
            new MonacoWebpackPlugin({}),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(
                            rootDir,
                            "node_modules/monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.ttf"
                        ),
                        to: path.resolve(buildDir, "monaco-code-icons.tff"),
                    },
                ],
            }),
            new webpack.DefinePlugin({
                "process.env": {
                },
            }),
            new webpack.ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
            }),
            // new BundleAnalyzerPlugin(),
        ],
    }
}

module.exports = {
    makeConfig,
}