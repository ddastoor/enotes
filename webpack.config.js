const path = require('path');

// npx webpack --config webpack.config.js

module.exports = {
  mode: 'production',
  entry: './webpack.js',
  output: {
    filename: 'enotes.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
