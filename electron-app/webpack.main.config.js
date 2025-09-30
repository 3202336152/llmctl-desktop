const path = require('path');

module.exports = {
  entry: './src/main/main.ts',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  externals: {
    'node-pty': 'commonjs node-pty'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};