import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { logger } from '../config/logger';

/**
 * Metadata fields that can be edited
 */
export interface MetadataFields {
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
}

/**
 * Response from metadata operations
 */
export interface MetadataResponse {
    success: boolean;
    filepath: string;
    message: string;
    metadata?: MetadataFields;
}

/**
 * Service for reading and modifying file metadata
 */
export class MetadataService {
    /**
     * Read metadata from a file
     * @param filepath Path to the file
     * @returns Promise with metadata information
     */
    public async readMetadata(filepath: string): Promise<MetadataResponse> {
        try {
            // Check if file exists
            await fs.access(filepath);

            // Use ffmpeg to read metadata
            const metadata = await this.executeFFprobe(filepath);

            return {
                success: true,
                filepath,
                message: 'Metadata retrieved successfully',
                metadata,
            };
        } catch (error) {
            logger.error(error, `Failed to read metadata for ${filepath}`);
            return {
                success: false,
                filepath,
                message: error instanceof Error ? error.message : 'Unknown error reading metadata',
            };
        }
    }

    /**
     * Edit metadata of a file
     * @param filepath Path to the file
     * @param metadata Metadata fields to update
     * @returns Promise with operation result
     */
    public async editMetadata(filepath: string, metadata: MetadataFields): Promise<MetadataResponse> {
        try {
            // Check if file exists
            await fs.access(filepath);

            // Prepare FFmpeg arguments for metadata editing
            const ffmpegArgs = this.buildFFmpegArgs(filepath, metadata);

            // Execute FFmpeg to edit metadata
            await this.executeFFmpeg(ffmpegArgs);

            // Read updated metadata
            const updatedMetadata = await this.executeFFprobe(filepath);

            return {
                success: true,
                filepath,
                message: 'Metadata updated successfully',
                metadata: updatedMetadata,
            };
        } catch (error) {
            logger.error(error, `Failed to edit metadata for ${filepath}`);
            return {
                success: false,
                filepath,
                message: error instanceof Error ? error.message : 'Unknown error editing metadata',
            };
        }
    }

    /**
     * Execute FFprobe to read metadata
     * @param filepath Path to the file
     * @returns Promise with metadata fields
     */
    private async executeFFprobe(filepath: string): Promise<MetadataFields> {
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
                    const metadata: MetadataFields = {
                        title: tags.title,
                        artist: tags.artist,
                        album: tags.album,
                        year: tags.date,
                        genre: tags.genre,
                        comment: tags.comment,
                        track: tags.track,
                        description: tags.description,
                        copyright: tags.copyright,
                        language: tags.language,
                    };

                    // Remove undefined fields
                    Object.keys(metadata).forEach(key => {
                        if (metadata[key as keyof MetadataFields] === undefined) {
                            delete metadata[key as keyof MetadataFields];
                        }
                    });

                    resolve(metadata);
                } catch (error) {
                    reject(new Error(`Failed to parse FFprobe output: ${error}`));
                }
            });
        });
    }

    /**
     * Build FFmpeg arguments for metadata editing
     * @param filepath Path to the file
     * @param metadata Metadata fields to update
     * @returns Array of FFmpeg arguments
     */
    private buildFFmpegArgs(filepath: string, metadata: MetadataFields): string[] {
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
        const args = [
            '-i',
            filepath, // Input file
            '-c',
            'copy', // Copy streams without re-encoding (fast)
            ...metadataArgs, // Metadata arguments
            '-y', // Overwrite output file
            tempFilePath, // Output to temporary file
        ];

        return [...args, filepath, tempFilePath]; // Return args and file paths for replacement
    }

    /**
     * Execute FFmpeg to edit metadata
     * @param args FFmpeg arguments and file paths
     * @returns Promise that resolves when operation completes
     */
    private async executeFFmpeg(args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            // Split the file paths from the args
            const [sourceFile, tempFile] = args.splice(-2);

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
                    await fs.rename(tempFile, sourceFile);
                    resolve();
                } catch (error) {
                    reject(new Error(`Failed to replace original file with edited version: ${error}`));
                }
            });
        });
    }
}
