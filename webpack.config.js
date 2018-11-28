const path = require('path')

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  target: 'node',
  output: {
    // options related to how webpack emits results
    path: path.resolve(__dirname, "dist"), // string
    // the target directory for all output files
    // must be an absolute path (use the Node.js path module)
    filename: "app.js", // string    // the filename template for entry chunks
  }
}
