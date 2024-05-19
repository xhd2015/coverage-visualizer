const base = require("./webpack.config.js")

module.exports = {
    ...base,
    output: {
        ...base.output,
        filename: "open-web.js",
        library: {
            name: 'Open',
            type: 'window'
        }
    },
    target: ['web']
}