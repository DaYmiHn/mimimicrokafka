const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist/umd'),
    filename: 'index.js',
    library: 'exampleTypescriptPackage',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts(x*)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'config/tsconfig.umd.json',
          },
        },
      },
    ],
  },
  modules: ['node_modules'],
  resolve: {
    extensions: ['.ts', '.js'],
    
    fallback: {
      "util": require.resolve("util/"),
      "crypto": require.resolve("crypto-browserify/"),
      "assert": require.resolve("assert/"),
      "util": require.resolve("util/"),
      "zlib": require.resolve("browserify-zlib/"),
    }
  },
}
