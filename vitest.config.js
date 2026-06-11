const path = require('path');

module.exports = {
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
};
