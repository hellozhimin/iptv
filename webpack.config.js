require('json5/lib/require');

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OfflinePlugin = require('offline-plugin');

const config = require('./config.json5');
const meta = require('./package');

module.exports = {
  entry: ['babel-polyfill', 'whatwg-fetch', './src/main.js'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'build.js',
    publicPath: config.baseUrl,
  },
  module: {
    rules: [{
      test: /\.(vue|js)$/,
      enforce: 'pre',
      exclude: /node_modules/,
      loader: 'eslint-loader',
    }, {
      test: /modernizr-config.json5$/,
      enforce: 'post',
      loader: 'modernizr-loader',
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: {
        },
        // other vue-loader options go here
      },
    }, {
      test: /\.json5$/,
      loader: 'json5-loader',
    }, {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }, {
      test: /\.css$/,
      loader: 'css-loader',
    }, {
      test: /materialize.scss$/,
      use: [
        'css-loader',
        'resolve-url-loader',
        {
          loader: 'sass-loader',
          options: {
            data: `
            $primary-color: ${config.primaryColor};
            $secondary-color: ${config.secondaryColor};
            $roboto-font-path: "../dist/fonts/roboto/";
            `,
          },
        },
      ],
    }, {
      test: /.scss$/,
      exclude: /materialize.scss$/,
      use: [
        'css-loader',
        'sass-loader',
      ],
    }, {
      enforce: 'post',
      test: /\.webmanifest$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
      },
    }, {
      test: /\.webmanifest$/,
      loader: 'webmanifest-loader',
      options: {
        data: {
          config,
        },
      },
    }, {
      enforce: 'post',
      test: /\.(css|scss)$/,
      loader: 'style-loader',
    }, {
      test: /\.(png|jpg|gif|svg|woff2|ttf|woff|eot|swf)$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]?[hash]',
      },
    }],
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.common.js',
      'modernizr$': path.resolve(__dirname, './modernizr-config.json5'),
    },
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
  },
  performance: {
    hints: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      WEBPACK_APP_VERSION: JSON.stringify(meta.version),
      WEBPACK_TIMESTAMP: JSON.stringify(Date.now()),
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new webpack.ProvidePlugin({
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],
  devtool: '#eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ]);
}

const externals = [
  config.channelsUrl,
  config.sponsorLogoUrl,
];

if (config.epgUrl && config.epgUrl.length) {
  externals.push(config.epgUrl);
}

// OfflinePlugin show be always the last plugin
module.exports.plugins = (module.exports.plugins || []).concat([
  new OfflinePlugin({
    externals,
    autoUpdate: true,
    responseStrategy: 'network-first',
    ServiceWorker: {
      prefetchRequest: {
        credentials: 'include',
        mode: 'cors',
      },
      cacheName: config.cacheName,
    },
    AppCache: false,
  }),
]);
