const path = require('path')
const CompressAssetsPlugin = require('./plugins/CompressAssetsPlugin');
const ExternalsWebpackPlugin = require('./plugins/ExternalsWebpackPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const EntryAddPlugin = require('./plugins/EntryAddPlugin')


module.exports = {
    mode: "development",
    entry: {
        main: path.resolve(__dirname, './src/index.js'),
    },
    devtool: false,
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: "[name].js",
        clean: true
    },
    resolve: {
        extensions: ['.js', '.json', '.wasm'],
    },
    externals: {
        vue: 'Vue',
        lodash: '_',
    },
    plugins: [
        new CompressAssetsPlugin({
            output: 'result.zip'
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        new ExternalsWebpackPlugin({
            lodash: {
                // cdn链接
                src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
                // 替代模块变量名
                variableName: '_',
            },
            vue: {
                src: 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js',
                variableName: 'vue',
            },
        }),
        new EntryAddPlugin({
            second: path.resolve(__dirname, './src/second.js')
        })
    ]
}