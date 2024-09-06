// const AsyncQueue = require('webpack/lib/util/AsyncQueue')
const AsyncQueue = require('./core/index')


function processor(item, callback) {
    setImmediate(() => {
        item.number = Math.random()
        callback(null, item)
    })
}

const queue = new AsyncQueue({
    processor,
    name: "addNumber",
    parallelism: 2,
    getKey: item => item.key
})


queue.add({ key: 'key1', name: "xeq1" }, (err, result) => {
    console.log('key1处理后的结', result);
})

queue.add({ key: 'key2', name: "xeq2" }, (err, result) => {
    console.log('key2处理后的结', result);
})

queue.add({ key: 'key3', name: "xeq3" }, (err, result) => {
    console.log('key3处理后的结', result);
})

queue.add({ key: 'key1', name: "xeq3" }, (err, result) => {
    console.log('repeat key1处理后的结', result);
})
