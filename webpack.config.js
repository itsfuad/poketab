const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
    entry: './public/js/src/main.js',
    output: {
        publicPath: '/',
        path: __dirname + '/public/js/dist',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    "css-loader",
                    "sass-loader"
                ],
            },
        ],
    },
    plugins: [
        new BundleAnalyzerPlugin(),
        new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          })
    ]
};