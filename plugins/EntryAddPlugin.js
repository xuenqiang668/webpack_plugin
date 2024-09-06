
class EntryAddPlugin {
    constructor(options) {
        this.options = this.getEntryFn(options)
    }

    apply(compiler) {
        compiler.hooks.entryOption.tap('EntryAddPlugin', (context, entry) => {
            /* ... */
            // console.log('context', context, '\n', 'entry', entry);
            Object.assign(entry, this.options)
        });
    }

    getEntryFn(options) {
        const tmpObj = Object.create(null)
        for (const [entryName, entryPath] of Object.entries(options)) {
            tmpObj[entryName] = {
                import: [entryPath]
            }
        }
        return tmpObj
    }
}



module.exports = EntryAddPlugin