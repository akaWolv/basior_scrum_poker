var path = require('path');
var webpack = require('webpack');
var reactDomLibPath = path.join(__dirname, "./node_modules/react-dom/lib");
var alias = {};
["EventPluginHub", "EventConstants", "EventPluginUtils", "EventPropagators",
    "SyntheticUIEvent", "CSSPropertyOperations", "ViewportMetrics"].forEach(function(filename){
    alias["react/lib/"+filename] = path.join(__dirname, "./node_modules/react-dom/lib", filename);
});

module.exports = {
    resolve: {alias: alias},
    entry: path.join(__dirname, 'app') + '/app.js',
    output: { path: path.join(__dirname, 'dist'), filename: 'bundle.js' },
    module: {
        loaders: [
            {
                test: /\.js|\.jsx$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            }
        ]
    },
    devServer: { historyApiFallback: true }
};