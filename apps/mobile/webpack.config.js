const webpack = require("@nativescript/webpack");
const { DefinePlugin, ProvidePlugin } = require('webpack');

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig("angular");

  webpack.chainWebpack((config) => {
    // Provide polyfills for Node.js globals
    config.plugin('provide-plugin').use(ProvidePlugin, [{
      process: 'process/browser',
    }]);

    // Fix module resolution issues
    config.resolve.set('fallback', {
      module: false,
      fs: false,
      path: false,
      url: false,
      util: false,
      stream: false,
      buffer: false,
    });

    // Define globals to fix runtime errors
    config.plugin('define-plugin').use(DefinePlugin, [{
      '__COMMONJS__': 'false',
      'global': 'globalThis',
    }]);
  });

  return webpack.resolveConfig();
};
