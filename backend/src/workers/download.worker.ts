import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import youtubeDl from 'youtube-dl-exec';

// Type definitions for worker data
interface DownloadWorkerData {
    videoUrl: string;
    outputPath: string;
    options: Record<string, string | boolean | number | string[]>;
    downloadId: string;
}

/**
 * Check if file exists with retry mechanism
 * Sometimes file operations can fail due to timing issues
 */
async function fileExists(filepath: string, retries = 3, delay = 500): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            await fs.access(filepath);
            return true;
        } catch (error) {
            if (i === retries - 1) {
                return false;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

/**
 * Find a file in a directory with retry mechanism
 */
async function findFileWithRetry(
    dirPath: string,
    searchPattern: string,
    retries = 3,
    delay = 500
): Promise<string | undefined> {
    for (let i = 0; i < retries; i++) {
        try {
            const files = await fs.readdir(dirPath);
            const foundFile = files.find(file => file.includes(searchPattern));
            if (foundFile) {
                return foundFile;
            }

            if (i === retries - 1) {
                return undefined;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return undefined;
}

// Main worker function for downloading
async function downloadVideo(data: DownloadWorkerData): Promise<{
    success: boolean;
    filePath?: string;
    fileSize?: number;
    error?: string;
}> {
    const { videoUrl, outputPath, options, downloadId } = data;

    try {
        // Ensure directory exists
        const dirPath = path.dirname(outputPath);
        await fs.mkdir(dirPath, { recursive: true });

        // Download the video with progress monitoring
        const downloadProcess = youtubeDl.exec(videoUrl, options);

        // Wait for download to complete
        await downloadProcess;

        // Find the downloaded file with retries
        const downloadedFile = await findFileWithRetry(dirPath, downloadId, 5, 1000);

        if (!downloadedFile) {
            throw new Error('Downloaded file not found after multiple attempts');
        }

        const filePath = path.join(dirPath, downloadedFile);

        // Check if file exists
        const exists = await fileExists(filePath, 5, 1000);
        if (!exists) {
            throw new Error(`File ${filePath} does not exist after download completion`);
        }

        // Get file stats with streaming to avoid loading the entire file
        const fileStats = fsSync.statSync(filePath);

        // Verify file size is greater than zero
        if (fileStats.size === 0) {
            throw new Error('Downloaded file has zero size');
        }

        return {
            success: true,
            filePath,
            fileSize: fileStats.size
        };
    } catch (error) {
        // Return error information
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// Handle incoming worker data
if (parentPort) {
    downloadVideo(workerData as DownloadWorkerData)
        .then((result) => {
            // Send result back to main thread
            parentPort?.postMessage(result);
        })
        .catch((error) => {
            // Send error back to main thread
            parentPort?.postMessage({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        });
} 