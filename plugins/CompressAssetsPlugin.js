const JSZip = require('jszip')
const { RawSource } = require('webpack-sources')

class CompressAssetsPlugin {
    constructor({ output }) {
        this.output = output
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('assets', (compilation, callback) => {
            // 获取本次打包生成所有的assets资源
            const assets = compilation.getAssets()
            // console.log(assets);
            // 创建zip对象
            const jszip = new JSZip()

            assets.forEach(({ name, source }) => {
                // 调用source()方法获得对应的源代码 这是一个源代码的字符串
                const code = source.source()
                // 往 zip 对象中添加资源名称和源代码内容
                jszip.file(name, code)
            })

            jszip.generateAsync({ type: 'nodebuffer' }).then(result => {
                // 通过 new RawSource 创建压缩包
                // 并且同时通过 compilation.emitAsset 方法将生成的 Zip 压缩包输出到 this.output
                compilation.emitAsset(this.output, new RawSource(result))
                // 调用 callback 表示本次事件函数结束
                callback()
            })
        })
    }
}

module.exports = CompressAssetsPlugin