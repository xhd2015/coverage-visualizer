const path = require("path")
const { makeConfig } = require("./mk-webpack.config.js")

const version = require("./version.js")

const entry = path.resolve(__dirname, "./index.ts")
const rootDir = path.resolve(__dirname, "../..")
const buildDir = path.resolve(__dirname, "build")

module.exports = makeConfig(entry, rootDir, buildDir, {
    // publicPath: `https://cdn.jsdelivr.net/npm/xgo-explorer@${version}/`,
    publicPath: `http://localhost:8081/npm-publish/`,
    // publicPath: "auto",
})