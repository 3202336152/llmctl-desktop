const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

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
  plugins: [
    new webpack.DefinePlugin({
      'process.env.LLMCTL_API_BASE_URL': JSON.stringify(process.env.LLMCTL_API_BASE_URL)
    })
  ],
  externals: {
    'node-pty': 'commonjs node-pty'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};