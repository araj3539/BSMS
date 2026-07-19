const embeddingService = require("../services/embedding.service");

class EmbeddingWorker {
    constructor(options = {}) {

        this.interval =
            options.interval ||
            Number(process.env.EMBEDDING_WORKER_INTERVAL) ||
            10000; // 10 seconds

        this.batchSize =
            options.batchSize ||
            Number(process.env.EMBEDDING_BATCH_SIZE) ||
            10;

        this.timer = null;

        this.running = false;

        this.started = false;
    }

    /**
     * Returns true if a processing cycle is currently running.
     */
    isRunning() {
        return this.running;
    }

    /**
     * Returns true if the worker has been started.
     */
    isStarted() {
        return this.started;
    }

    /**
     * Start the worker.
     */
    start() {

        if (this.started) {

            console.log("[EmbeddingWorker] Already started.");

            return;
        }

        console.log(
            `[EmbeddingWorker] Starting... (Interval: ${this.interval}ms)`
        );

        this.started = true;

        // Run immediately once
        this.runNow();

        // Schedule future runs
        this.timer = setInterval(() => {

            this.runNow();

        }, this.interval);

    }

    /**
     * Stop the worker.
     */
    stop() {

        if (!this.started) {

            return;
        }

        clearInterval(this.timer);

        this.timer = null;

        this.started = false;

        console.log("[EmbeddingWorker] Stopped.");

    }
        /**
     * Execute one processing cycle.
     */
    async runNow() {

        if (this.running) {

            console.log(
                "[EmbeddingWorker] Previous cycle still running. Skipping..."
            );

            return;
        }

        this.running = true;

        try {

            console.log(
                "[EmbeddingWorker] Checking pending embeddings..."
            );

            const result =
                await embeddingService.processPendingBooks(
                    this.batchSize
                );

            if (result.processed === 0) {

                console.log(
                    "[EmbeddingWorker] No pending books."
                );

            } else {

                console.log(

                    `[EmbeddingWorker] Processed: ${result.processed} | ` +
                    `Success: ${result.succeeded} | ` +
                    `Failed: ${result.failed}`

                );

            }

            return result;

        }

        catch (error) {

            console.error(
                "[EmbeddingWorker] Processing failed."
            );

            console.error(error);

        }

        finally {

            this.running = false;

        }

    }

}

/**
 * Create singleton worker instance.
 */
const worker = new EmbeddingWorker();

/**
 * Graceful shutdown.
 */
process.on("SIGINT", () => {

    console.log(
        "\n[EmbeddingWorker] SIGINT received."
    );

    worker.stop();

});

process.on("SIGTERM", () => {

    console.log(
        "\n[EmbeddingWorker] SIGTERM received."
    );

    worker.stop();

});

module.exports = worker;