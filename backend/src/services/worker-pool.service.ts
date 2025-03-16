import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Default to number of CPU cores - 1 (keep one for main thread)
const DEFAULT_POOL_SIZE = Math.max(1, os.cpus().length - 1);

/**
 * Task definition for worker pool
 */
export interface WorkerTask {
  taskType: 'download' | 'metadata';
  taskData: Record<string, unknown>;
}

/**
 * Result from a worker task
 */
export interface WorkerResult {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Worker task callback function
 */
type TaskCallback = (error: Error | null, result?: WorkerResult) => void;

/**
 * Task queue item
 */
interface QueueItem {
  task: WorkerTask;
  callback: TaskCallback;
}

/**
 * Worker pool for handling CPU-intensive tasks in separate threads
 */
export class WorkerPool {
  private workers: Worker[];
  private queue: QueueItem[];
  private activeWorkers: number;
  private maxWorkers: number;

  constructor() {
    this.maxWorkers = env.WORKER_POOL_SIZE || DEFAULT_POOL_SIZE;
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;

    logger.info(`Initializing worker pool with ${this.maxWorkers} workers`);
  }

  /**
   * Execute a task using a worker thread
   */
  public runTask(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      // Add task to queue with callback to resolve/reject promise
      this.queue.push({
        task,
        callback: (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!);
          }
        },
      });

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Process tasks in the queue
   */
  private processQueue(): void {
    // If no active workers and the queue is empty, return
    if (this.queue.length === 0) {
      return;
    }

    // If we have reached the maximum number of workers, return
    if (this.activeWorkers >= this.maxWorkers) {
      return;
    }

    // Get the next task from the queue
    const item = this.queue.shift();

    if (!item) {
      return;
    }

    // Increment active workers counter
    this.activeWorkers++;

    // Create and run a worker
    this.runWorker(item.task, (error, result) => {
      // Decrement active workers counter
      this.activeWorkers--;

      // Call the original callback
      item.callback(error, result);

      // Process the next task in the queue
      this.processQueue();
    });
  }

  /**
   * Run a worker for a specific task
   */
  private runWorker(task: WorkerTask, callback: TaskCallback): void {
    // Determine worker script path based on task type
    let workerPath: string;

    switch (task.taskType) {
      case 'download':
        workerPath = path.resolve(__dirname, '../workers/download.worker.js');
        break;
      case 'metadata':
        workerPath = path.resolve(__dirname, '../workers/metadata.worker.js');
        break;
      default:
        return callback(new Error(`Unknown task type: ${task.taskType}`));
    }

    try {
      // Create a new worker
      const worker = new Worker(workerPath, {
        workerData: task.taskData,
      });

      // Handle worker events
      worker.on('message', result => {
        callback(null, result);
      });

      worker.on('error', error => {
        logger.error(error, `Worker error for task type: ${task.taskType}`);
        callback(error);
      });

      worker.on('exit', code => {
        if (code !== 0) {
          callback(new Error(`Worker exited with code ${code}`));
        }
      });
    } catch (error) {
      logger.error(error, `Failed to create worker for task type: ${task.taskType}`);
      callback(error as Error);
    }
  }

  /**
   * Clean up resources
   */
  public terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;

    logger.debug('Worker pool terminated');
  }
}
