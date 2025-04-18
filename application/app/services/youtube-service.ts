'use server';

import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import ytDlpExec from 'yt-dlp-exec';
import {
    VideoResponse,
    DownloadRequest,
    DownloadResponse,
    ProgressInfo
} from '../types/video';

// Use promisified exec for more control
const execPromise = promisify(exec);

// Type for download progress tracking
interface DownloadProgress {
    id: string;
    progress: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error?: string;
    filepath?: string;
    filesize?: number;
    contentType?: string;
    filename?: string;
    title?: string;
    directUrl?: string;
    timestamp: number;
}

// In-memory store for progress tracking
// In production, this would be replaced with Redis or another external store
const downloadProgress = new Map<string, DownloadProgress>();

// Download directory
let downloadDir = process.env.DOWNLOAD_TEMP_DIR || './data';
const maxConcurrentDownloads = Number(process.env.MAX_CONCURRENT_DOWNLOADS || 5);
let activeDownloads = 0;

// Get yt-dlp path from environment variable or use default
const ytDlpPath = process.env.YT_DLP_PATH || 'yt-dlp';

// Ensure download directory exists
async function ensureDownloadDir() {
    try {
        // Check if directory exists
        try {
            const stats = await fs.stat(downloadDir);
            if (!stats.isDirectory()) {
                console.error(`Path exists but is not a directory: ${downloadDir}`);
                // If it's a file, try to create the directory with a different name
                await fs.mkdir(`${downloadDir}_dir`, { recursive: true });
                // Update the download directory path
                downloadDir = `${downloadDir}_dir`;
            }
        } catch (error) {
            // Directory doesn't exist, create it
            console.log(`Creating download directory: ${downloadDir}`);
            await fs.mkdir(downloadDir, { recursive: true, mode: 0o755 });

            // In case of permission issues, try to create in a temp location
            try {
                await fs.access(downloadDir, fsConstants.W_OK);
            } catch (err) {
                console.error(`Cannot write to ${downloadDir}, using temp directory instead`);
                // Use the OS temporary directory as a fallback
                downloadDir = path.join(os.tmpdir(), 'youtube-downloads');
                await fs.mkdir(downloadDir, { recursive: true, mode: 0o755 });
            }
        }

        console.log(`Download directory ready: ${downloadDir}`);
    } catch (error) {
        console.error('Failed to create download directory:', error);
        throw new Error('Failed to initialize download directory');
    }
}

// Initialize
ensureDownloadDir();

// Cleanup old files periodically (called from a page route handler)
export async function cleanupOldFiles() {
    try {
        const maxAgeHours = Number(process.env.MAX_FILE_AGE_HOURS || 24);
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const now = Date.now();

        const files = await fs.readdir(downloadDir);

        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(downloadDir, file);
            const stats = await fs.stat(filePath);

            if (now - stats.mtime.getTime() > maxAgeMs) {
                await fs.unlink(filePath);
                deletedCount++;
            }
        }

        return { success: true, deleted: deletedCount };
    } catch (error) {
        console.error('Error cleaning up old files:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Execute yt-dlp using child_process instead of yt-dlp-exec
 */
async function executeYtDlp(url, options) {
    // Convert options object to command-line arguments
    const args = Object.entries(options).map(([key, value]) => {
        // Convert camelCase to kebab-case with -- prefix
        const flag = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

        // Handle boolean flags
        if (typeof value === 'boolean') {
            return value ? `--${flag}` : '';
        }

        // Handle other types
        return `--${flag} ${value}`;
    }).filter(Boolean).join(' ');

    // Check if the ytDlpPath exists first (very simple check)
    let ytDlpCommand = ytDlpPath;

    // Try to determine if we should just use 'yt-dlp' command directly
    try {
        await fs.access(ytDlpPath);
    } catch (err) {
        console.log(`Path ${ytDlpPath} not accessible, falling back to 'yt-dlp' command`);
        ytDlpCommand = 'yt-dlp';
    }

    const command = `${ytDlpCommand} ${url} ${args}`;
    console.log(`Executing: ${command}`);

    try {
        const { stdout } = await execPromise(command);
        // Parse JSON output for JSON commands
        if (options.dumpSingleJson) {
            return JSON.parse(stdout);
        }
        return stdout;
    } catch (error) {
        console.error('yt-dlp execution error:', error);
        throw new Error(`Failed to execute yt-dlp: ${error.message}`);
    }
}

/**
 * Get video information by URL
 */
export async function getVideoInfo(url: string): Promise<VideoResponse> {
    try {
        // Check for invalid URL format
        if (
            !url.includes('youtube.com/watch?v=') &&
            !url.includes('youtube.com/shorts/') &&
            !url.includes('youtu.be/')
        ) {
            throw new Error('Invalid URL. Please provide a valid YouTube URL (regular video or shorts).');
        }

        // Get video info without using cookies
        const result = await executeYtDlp(url, {
            dumpSingleJson: true,
            noCheckCertificate: true,
            noWarnings: true,
            socketTimeout: 10000
        });

        // Transform into VideoResponse format
        const thumbnails = Array.isArray(result.thumbnails) ? result.thumbnails : [];
        const bestThumbnail = thumbnails.length > 0
            ? thumbnails[thumbnails.length - 1].url
            : '';

        return {
            id: result.id,
            formats: result.formats || [],
            videoDetails: {
                id: result.id,
                title: result.title,
                description: result.description || '',
                duration: result.duration || 0,
                thumbnail: bestThumbnail,
                uploadDate: result.upload_date || '',
                views: result.view_count || 0,
                author: result.uploader || '',
            }
        };
    } catch (error) {
        console.error('Error fetching video info:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to get video information.');
    }
}

/**
 * Download video
 */
export async function downloadVideo(options: DownloadRequest): Promise<DownloadResponse> {
    const { videoUrl, formatId, extractAudio, audioFormat, quality } = options;

    // Generate unique ID for this download
    const downloadId = randomUUID();

    // Initialize progress tracking with current timestamp
    downloadProgress.set(downloadId, {
        id: downloadId,
        progress: 0,
        status: 'queued',
        timestamp: Date.now(),
    });

    try {
        // Check if we're at max concurrent downloads
        if (activeDownloads >= maxConcurrentDownloads) {
            throw new Error('Maximum concurrent downloads reached. Please try again later.');
        }

        activeDownloads++;

        // First get the video info to get the title and possibly direct URLs
        let videoTitle = '';
        let directUrl = '';

        try {
            // Get info about the video first, including available formats
            const videoInfo = await executeYtDlp(videoUrl, {
                dumpSingleJson: true,
                skipDownload: true,
                noCheckCertificate: true,
                noWarnings: true,
            });

            videoTitle = videoInfo.title || '';

            // Check if the selected format has a direct URL
            if (formatId) {
                const selectedFormat = videoInfo.formats?.find(f => f.format_id === formatId);
                if (selectedFormat && selectedFormat.url) {
                    // Make sure the URL is a valid HTTPS URL and not too long
                    if (selectedFormat.url.startsWith('https://') && selectedFormat.url.length < 2000) {
                        directUrl = selectedFormat.url;
                        console.log(`Found direct URL for format ${formatId}`);
                        console.log(`URL length: ${directUrl.length} characters`);

                        // Update progress with direct URL and mark as completed
                        downloadProgress.set(downloadId, {
                            ...downloadProgress.get(downloadId)!,
                            title: videoTitle,
                            directUrl: directUrl,
                            status: 'completed',
                            progress: 100,
                        });

                        // Return early with direct URL in the response
                        return {
                            id: downloadId,
                            title: videoTitle,
                            downloadUrl: `/api/youtube/download/${downloadId}`,
                            fileName: `${videoTitle}.${extractAudio ? audioFormat || 'mp3' : 'mp4'}`,
                            contentType: extractAudio ? `audio/${audioFormat || 'mp3'}` : 'video/mp4',
                            fileSize: 0, // Size unknown for direct URLs
                        };
                    } else {
                        console.log(`Direct URL available but not usable: HTTPS: ${selectedFormat.url.startsWith('https://')}, Length: ${selectedFormat.url.length}`);
                    }
                }
            }

            // Update progress with title
            downloadProgress.set(downloadId, {
                ...downloadProgress.get(downloadId)!,
                title: videoTitle,
            });
        } catch (error) {
            console.log('Could not get video title or direct URL, continuing with download:', error);
        }

        // Ensure download directory exists
        await ensureDownloadDir();

        // Generate a unique filename
        const timestamp = Date.now();
        const tempFilename = `${downloadId}_${timestamp}`;
        const tempFilePath = path.join(downloadDir, tempFilename);

        // Update progress
        downloadProgress.set(downloadId, {
            ...downloadProgress.get(downloadId)!,
            status: 'processing',
            progress: 5,
        });

        // Prepare yt-dlp options
        const ytDlpOptions: Record<string, any> = {
            output: tempFilePath,
            noCheckCertificate: true,
            noWarnings: true,
            verbose: true,
        };

        // Handle format selection
        if (extractAudio) {
            ytDlpOptions.extractAudio = true;
            ytDlpOptions.audioFormat = audioFormat || 'mp3';
            ytDlpOptions.audioQuality = quality || '0'; // 0 is best
        } else if (formatId) {
            ytDlpOptions.format = formatId;
        } else {
            ytDlpOptions.format = 'best[ext=mp4]/best'; // Default to best MP4
        }

        // Execute download using child_process instead of yt-dlp-exec
        await executeYtDlp(videoUrl, ytDlpOptions);

        // The filename with extension is based on the downloaded file
        const finalFilename = tempFilename + (extractAudio ? `.${audioFormat || 'mp3'}` : '.mp4');
        const finalFilePath = path.join(downloadDir, finalFilename);

        // Check if file exists
        const stats = await fs.stat(finalFilePath);

        // Update progress to complete
        downloadProgress.set(downloadId, {
            ...downloadProgress.get(downloadId)!,
            status: 'completed',
            progress: 100,
            filepath: finalFilePath,
            filesize: stats.size,
            contentType: extractAudio
                ? `audio/${audioFormat || 'mp3'}`
                : 'video/mp4',
            filename: finalFilename,
        });

        // Create the response
        const downloadResponse: DownloadResponse = {
            id: downloadId,
            title: videoTitle || finalFilename,
            downloadUrl: `/api/youtube/download/${downloadId}`,
            fileName: finalFilename,
            contentType: extractAudio ? `audio/${audioFormat || 'mp3'}` : 'video/mp4',
            fileSize: stats.size,
        };

        return downloadResponse;
    } catch (error) {
        console.error('Error downloading video:', error);

        // Update progress to failed
        downloadProgress.set(downloadId, {
            ...downloadProgress.get(downloadId)!,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            progress: 0,
        });

        throw new Error(error instanceof Error ? error.message : 'Failed to download video');
    } finally {
        activeDownloads--;
    }
}

/**
 * Get download progress
 */
export async function getDownloadProgress(id: string): Promise<ProgressInfo> {
    const progress = downloadProgress.get(id);

    if (!progress) {
        return {
            status: 'not_found',
            progress: 0,
        };
    }

    return {
        status: progress.status,
        progress: progress.progress,
        error: progress.error,
    };
}

/**
 * Get full download progress data including file and title information
 */
export async function getDownloadProgressData(id: string): Promise<DownloadProgress | null> {
    return downloadProgress.get(id) || null;
}

/**
 * Extract YouTube video ID from URL
 */
function extractVideoId(url: string): string {
    let videoId = '';

    // Regular URL format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch?v=')) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match && match[1]) {
            videoId = match[1];
        }
    }
    // Short URL format: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        if (match && match[1]) {
            videoId = match[1];
        }
    }
    // Shorts URL format: https://www.youtube.com/shorts/VIDEO_ID
    else if (url.includes('youtube.com/shorts/')) {
        const match = url.match(/shorts\/([^?&]+)/);
        if (match && match[1]) {
            videoId = match[1];
        }
    }

    return videoId;
}

/**
 * Direct MP3 download helper
 */
export async function downloadMP3(videoUrl: string, providedTitle?: string): Promise<DownloadResponse> {
    try {
        // Extract video ID from URL
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            throw new Error('Could not extract video ID from URL');
        }

        // Use provided title if available
        let videoTitle = providedTitle || '';

        // Generate a unique filename based on video ID
        const filename = `${videoId}.mp3`;
        const filePath = path.join(downloadDir, filename);

        // Check if file already exists
        try {
            await fs.access(filePath);
            console.log(`File already exists: ${filePath}, returning existing file`);

            // Get file stats
            const stats = await fs.stat(filePath);

            // Generate a download ID for tracking
            const downloadId = randomUUID();

            // Set download as completed
            downloadProgress.set(downloadId, {
                id: downloadId,
                status: 'completed',
                progress: 100,
                filepath: filePath,
                filesize: stats.size,
                contentType: 'audio/mp3',
                filename,
                title: videoTitle || videoId,
                timestamp: Date.now(),
            });

            // Return the existing file info
            return {
                id: downloadId,
                title: videoTitle || videoId,
                downloadUrl: `/api/youtube/download/${downloadId}`,
                fileName: filename,
                contentType: 'audio/mp3',
                fileSize: stats.size,
            };
        } catch (error) {
            // File doesn't exist, continue with download
            console.log(`File ${filePath} doesn't exist, downloading...`);
        }

        // Generate a download ID for tracking
        const downloadId = randomUUID();

        // Initialize progress tracking with current timestamp
        downloadProgress.set(downloadId, {
            id: downloadId,
            progress: 0,
            status: 'queued',
            timestamp: Date.now(),
        });

        // If title was not provided, try to get info about the video to get title
        if (!videoTitle) {
            try {
                // Get info about the video
                const videoInfo = await executeYtDlp(videoUrl, {
                    dumpSingleJson: true,
                    skipDownload: true,
                    noCheckCertificate: true,
                    noWarnings: true,
                });

                videoTitle = videoInfo.title || '';

                // Update progress with title
                downloadProgress.set(downloadId, {
                    ...downloadProgress.get(downloadId)!,
                    title: videoTitle,
                    status: 'processing',
                    progress: 10,
                });
            } catch (error) {
                console.log('Could not get video title, continuing with download:', error);
                // Use video ID as title if title couldn't be retrieved
                videoTitle = videoId;
            }
        } else {
            // Update progress with the provided title
            downloadProgress.set(downloadId, {
                ...downloadProgress.get(downloadId)!,
                title: videoTitle,
                status: 'processing',
                progress: 10,
            });
        }

        // Ensure download directory exists
        await ensureDownloadDir();

        // Update progress
        downloadProgress.set(downloadId, {
            ...downloadProgress.get(downloadId)!,
            status: 'processing',
            progress: 20,
        });

        // Download as mp3
        console.log(`Downloading MP3 to: ${filePath}`);
        await executeYtDlp(videoUrl, {
            output: filePath,
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0',
            noCheckCertificate: true,
            noWarnings: true,
            verbose: true,
        });

        // Check if file exists
        try {
            const stats = await fs.stat(filePath);
            console.log(`File successfully downloaded: ${filePath} (${stats.size} bytes)`);

            // Update progress to complete
            downloadProgress.set(downloadId, {
                ...downloadProgress.get(downloadId)!,
                status: 'completed',
                progress: 100,
                filepath: filePath,
                filesize: stats.size,
                contentType: 'audio/mp3',
                filename,
            });

            // Create the response
            return {
                id: downloadId,
                title: videoTitle || filename,
                downloadUrl: `/api/youtube/download/${downloadId}`,
                fileName: filename,
                contentType: 'audio/mp3',
                fileSize: stats.size,
            };
        } catch (error) {
            console.error(`Error checking downloaded file: ${filePath}`, error);
            throw new Error('Failed to download audio file');
        }
    } catch (error) {
        console.error('Error in MP3 download:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to download MP3');
    }
} 