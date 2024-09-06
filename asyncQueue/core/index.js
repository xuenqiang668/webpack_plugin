const ArrayQueue = require('./ArrayQueue')

const QUEUED_STATE = 0;
const PROCESSING_STATE = 1;
const DONE_STATE = 2;



class AsyncQueueEntry {
    /**
     * @param {T} item the item
     * @param {Callback<R>} callback the callback
     */
    constructor(item, callback) {
        this.item = item;  // 保存传入Task需要处理的值
        /** @type {typeof QUEUED_STATE | typeof PROCESSING_STATE | typeof DONE_STATE} */
        this.state = QUEUED_STATE; // 初始化状态
        /** @type {Callback<R> | undefined} */  // 保存传入Task完成的Callback 
        this.callback = callback;
        /** @type {Callback<R>[] | undefined} */
        this.callbacks = undefined;
        /** @type {R | null | undefined} */
        this.result = undefined;   // 保存当前任务处理后的结果
        /** @type {WebpackError | null | undefined} */
        this.error = undefined;   // 保存当前任务处理后的错误
    }
}


class AsyncQueue {
    constructor({ name, parallelism, processor, getKey }) {
        // 名称
        this._name = name
        // 并发执行最大数
        this._parallelism = parallelism
        // 处理器函数
        this._processor = processor
        // 唯一标示函数
        this._getKey = getKey
        // 保存当前队列中所有已经执行过的任务
        this._entries = new Map();
        // 保存当前队列中等执行的任务
        this._queued = new ArrayQueue();

        // 当前并发任务
        this._activeTasks = 0;
        // 是否开启下次事件队列EventLoop中等待执行的函数
        this._willEnsureProcessing = false;
        // 队列是否已经结束
        this._stopped = false;

        this._ensureProcessing = this._ensureProcessing.bind(this);
    }


    add(item, callback) {
        if (this._stopped) return callback('Queue was stopped')

        // 获取当前添加的唯一key
        const key = this._getKey(item)
        const entry = this._entries.get(key)

        if (entry !== undefined) {
            if (entry.state === DONE_STATE) {
                process.nextTick(() => callback(entry.error, entry.result));
            } else if (entry.callbacks === undefined) {
                entry.callbacks = [callback];
            } else {
                entry.callbacks.push(callback);
            }
            return;
        }
        // 创建一个新的entry对象
        const newEntry = new AsyncQueueEntry(item, callback);


        this._entries.set(key, newEntry);
        this._queued.enqueue(newEntry);

        // _willEnsureProcessing为false表示下次EventLoop中并不会调用调用器执行任务
        // 当_willEnsureProcessing为false时我们需要在下一次EventLoop中执行调度器中的任务
        // 并且将_willEnsureProcessing设置为true，防止本次EventLoop多次add造成下次EventLoop中多次重复执行任务

        if (this._willEnsureProcessing === false) {
            this._willEnsureProcessing = true;
            setImmediate(this._ensureProcessing);
        }

    }
    // 迭代队列执行
    _ensureProcessing() {
        // 当还可以执行时
        while (this._activeTasks < this._parallelism) {
            // 获取最顶部排队任务
            const entry = this._queued.dequeue()
            // 如果已经没有任务了直接退出while循环
            if (entry === undefined) break
            this._activeTasks++
            // 修改任务状态处理中
            entry.state = PROCESSING_STATE;
            this._startProcessing(entry);
        }
        // 重置本次EventLoop中的_willEnsureProcessing为false
        this._willEnsureProcessing = false;
    }

    // 处理Task
    _startProcessing(entry) {
        this._processor(entry.item, (e, r) => {
            if (e) {
                this._handleResult(
                    entry,
                    new Error(`AsyncQueue(${this.name} processor error.)`)
                );
            }

            this._handleResult(entry, e, r);
        })
    }

    _handleResult(entry, e, r) {
        const callback = /** @type {Callback<R>} */ (entry.callback);
        const callbacks = entry.callbacks;

        entry.state = DONE_STATE
        entry.callback = undefined;
        entry.callbacks = undefined;
        entry.result = r;
        entry.error = e;

        this._activeTasks--


        process.nextTick(() => {
            callback(e, r);
            if (callbacks !== undefined) {
                for (const callback of callbacks) {
                    callback(e, r);
                }
            }
        });


        // 当调度器任务完成时
        // 如果下一次EventLoop中并没有安排调度器执行
        // 那么重置this._willEnsureProcessing状态 开启调度器执行
        if (this._willEnsureProcessing === false) {
            this._willEnsureProcessing = true;
            setImmediate(this._ensureProcessing);
        }
    }
}



module.exports = AsyncQueue