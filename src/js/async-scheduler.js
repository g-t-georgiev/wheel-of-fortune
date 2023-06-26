export class AsyncScheduler {
    constructor() {
        this.queue = [];
        this.running = false;
    }

    schedule(callback) {
        return new Promise((resolve) => {
            this.queue.push({ callback, resolve });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.running) return;
        this.running = true;

        while (this.queue.length > 0) {
            const subscriber = this.queue.shift();
            const { callback, resolve } = subscriber;
            const timestamp = performance.now();
            await callback(timestamp);
            resolve();
        }

        this.running = false;
    }
}