import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

// Type definitions for worker data
interface MetadataWorkerData {
  taskType: 'read' | 'edit';
  filepath: string;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
    comment?: string;
    track?: string;
    description?: string;
    copyright?: string;
    language?: string;
  };
}

// Type for metadata result
interface MetadataResult {
  success: boolean;
  metadata?: Record<string, string>;
  error?: string;
}

/**
 * Process a metadata task
 */
async function processTask(data: MetadataWorkerData): Promise<MetadataResult> {
  try {
    // Check if file exists
    await fs.access(data.filepath);

    if (data.taskType === 'read') {
      return await readMetadata(data.filepath);
    } else if (data.taskType === 'edit' && data.metadata) {
      return await editMetadata(data.filepath, data.metadata);
    } else {
      throw new Error(`Invalid task type or missing metadata: ${data.taskType}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Read metadata from a file using ffprobe
 */
async function readMetadata(filepath: string): Promise<MetadataResult> {
  return new Promise((resolve, reject) => {
    // FFprobe arguments to read metadata
    const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', filepath];

    const ffprobe = spawn('ffprobe', args);
    let stdoutData = '';
    let stderrData = '';

    ffprobe.stdout.on('data', data => {
      stdoutData += data.toString();
    });

    ffprobe.stderr.on('data', data => {
      stderrData += data.toString();
    });

    ffprobe.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`FFprobe failed with code ${code}: ${stderrData}`));
      }

      try {
        // Parse the JSON output
        const result = JSON.parse(stdoutData);
        const format = result.format || {};
        const tags = format.tags || {};

        // Extract relevant metadata
        const metadata: Record<string, string> = {};

        // Add tags that exist
        if (tags.title) metadata.title = tags.title;
        if (tags.artist) metadata.artist = tags.artist;
        if (tags.album) metadata.album = tags.album;
        if (tags.date) metadata.year = tags.date;
        if (tags.genre) metadata.genre = tags.genre;
        if (tags.comment) metadata.comment = tags.comment;
        if (tags.track) metadata.track = tags.track;
        if (tags.description) metadata.description = tags.description;
        if (tags.copyright) metadata.copyright = tags.copyright;
        if (tags.language) metadata.language = tags.language;

        resolve({
          success: true,
          metadata,
        });
      } catch (error) {
        reject(new Error(`Failed to parse FFprobe output: ${error}`));
      }
    });
  });
}

/**
 * Edit metadata of a file using ffmpeg
 */
async function editMetadata(
  filepath: string,
  metadata: Record<string, string>
): Promise<MetadataResult> {
  // Use a regular promise instead of async executor
  return new Promise((resolve, reject) => {
    // Use an immediately-invoked async function inside
    (async () => {
      try {
        // Check if file exists
        await fs.access(filepath);

        const fileExt = path.extname(filepath);
        const tempFilePath = filepath.replace(fileExt, `_temp${fileExt}`);

        // Build the metadata arguments
        const metadataArgs: string[] = [];

        // Add arguments for each metadata field
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            metadataArgs.push('-metadata', `${key}=${value}`);
          }
        });

        // Build the full FFmpeg command
        const args = ['-i', filepath, '-c', 'copy', ...metadataArgs, '-y', tempFilePath];

        const ffmpeg = spawn('ffmpeg', args);
        let stderrData = '';

        ffmpeg.stderr.on('data', data => {
          stderrData += data.toString();
        });

        ffmpeg.on('close', async code => {
          if (code !== 0) {
            return reject(new Error(`FFmpeg failed with code ${code}: ${stderrData}`));
          }

          try {
            // Replace the original file with the temporary file
            await fs.rename(tempFilePath, filepath);

            // Read updated metadata
            const result = await readMetadata(filepath);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to replace original file with edited version: ${error}`));
          }
        });
      } catch (error) {
        reject(new Error(`Failed to edit metadata: ${error}`));
      }
    })().catch(reject);
  });
}

// Handle incoming worker data
if (parentPort) {
  const data = workerData as MetadataWorkerData;

  // Execute the task and send result back to main thread
  processTask(data)
    .then(result => {
      parentPort?.postMessage(result);
    })
    .catch(error => {
      parentPort?.postMessage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    });
}
