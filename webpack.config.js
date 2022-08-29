const path = require("path");
const fs = require("fs");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  entry: {
    // "monaco-tree": "./src/lib.js",
    "monaco-tree": "./src/index.js",
  },
  output: {
    filename: "monaco-tree.js",
    path: path.resolve(__dirname, "dist/build"),
    library: "MonacoTree",
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["file?name=[name].[ext]"],
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
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
    extensions: [".tsx", ".ts", "jsx", ".js"],
  },
  plugins: [new MonacoWebpackPlugin({})],
};
