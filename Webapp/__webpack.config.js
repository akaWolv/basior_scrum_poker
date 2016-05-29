const  IS_PRODUCTION = process.argv.indexOf('--production') >= -1;
var webpack = require('webpack');

var excludes = [];
if (true === IS_PRODUCTION) {
    excludes.push('./config.local.js');
}


module.exports = {
    entry: {
        app: ['webpack/hot/dev-server', './src/js/app.js'],
    },
    output: {
        path: './public/built',
        filename: 'bundle.js',
        publicPath: 'http://localhost:8080/built/'
    },
    devServer: {
        contentBase: './public',
        publicPath: 'http://localhost:8080/built/',
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    },
    exclude : excludes,
    module: {
        loaders: [
            {test: /\.js|\.jsx$/, exclude: /node_modules/, loader: "babel", query: {presets: ['react', 'es2015']}},
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {test: /\.less$/, loader: 'style-loader!css-loader!less-loader'}
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.IgnorePlugin(new RegExp("^(fs|ipc)$"))
    ],
    externals: [
        (function () {
            var IGNORES = [
                'electron'
            ];
            return function (context, request, callback) {
                if (IGNORES.indexOf(request) >= 0) {
                    return callback(null, "require('" + request + "')");
                }
                return callback();
            };
        })()
    ]
}