import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { z } from 'zod';
import os from 'os';
import fs from 'fs';

// Path to yt-dlp binary
const YT_DLP_PATH = path.join(process.cwd(), 'bin', 'yt-dlp');

// Input validation schema
const requestSchema = z.object({
    url: z.string().url('Invalid YouTube URL'),
    format: z.string().optional(),
    audioOnly: z.union([z.boolean(), z.string()]).optional(),
    filename: z.string().optional(),
});

// Sanitize filename for Content-Disposition header
function sanitizeFilename(filename: string, extension?: string): string {
    // Remove any existing file extension
    let cleanName = filename.replace(/\.[^/.]+$/, "");

    // Replace unsafe characters but preserve spaces and some special characters
    // Also remove all non-ASCII characters including emojis
    cleanName = cleanName
        .replace(/[\\/:*?"<>|]/g, "") // Remove characters that are invalid in filenames
        .replace(/[^\x00-\x7F]/g, "") // Remove all non-ASCII characters (including emojis)
        .replace(/\s+/g, " ")         // Replace multiple spaces with a single space
        .trim()
        .substring(0, 100);           // Limit length

    // Ensure the filename is not empty after sanitization
    if (!cleanName) {
        cleanName = "youtube-video";
    }

    // Add the extension if provided
    if (extension) {
        return `${cleanName}.${extension}`;
    }

    return cleanName;
}

export async function POST(request: NextRequest) {
    try {
        let data: any;
        const contentType = request.headers.get('content-type') || '';

        // Handle different content types
        if (contentType.includes('application/json')) {
            // Parse JSON body
            data = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Parse form data
            const formData = await request.formData();
            data = Object.fromEntries(formData.entries());

            // Convert string 'true'/'false' to boolean for audioOnly
            if (data.audioOnly === 'true') data.audioOnly = true;
            if (data.audioOnly === 'false') data.audioOnly = false;
        } else {
            return NextResponse.json(
                { error: 'Unsupported content type' },
                { status: 415 }
            );
        }

        // Validate request data
        const result = requestSchema.safeParse(data);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { url, format, audioOnly, filename } = result.data;

        // Validate YouTube URL
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json(
                { error: 'Only YouTube URLs are supported' },
                { status: 400 }
            );
        }

        // First get the video title if filename is not provided
        let videoTitle = filename || '';

        if (!videoTitle) {
            try {
                // Get video info using yt-dlp to get the title
                const infoProcess = spawn(YT_DLP_PATH, [
                    '--dump-json',
                    '--no-check-certificate',
                    '--no-warnings',
                    url
                ]);

                let infoData = '';
                infoProcess.stdout.on('data', (chunk) => {
                    infoData += chunk.toString();
                });

                const infoResult = await new Promise<string>((resolve, reject) => {
                    infoProcess.on('close', (code) => {
                        if (code === 0) {
                            resolve(infoData);
                        } else {
                            reject(new Error(`yt-dlp info process exited with code ${code}`));
                        }
                    });

                    infoProcess.on('error', (err) => {
                        reject(err);
                    });
                });

                const videoInfo = JSON.parse(infoData);
                videoTitle = videoInfo.title || 'youtube-video';
            } catch (error) {
                console.error('Error getting video title:', error);
                videoTitle = 'youtube-video';
            }
        }

        // Sanitize the video title for safe filename
        const sanitizedTitle = sanitizeFilename(videoTitle);

        // Build yt-dlp args
        const args = [
            '--no-check-certificate',
            '--no-cache-dir',
        ];

        if (audioOnly) {
            args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');

            // For audio files, output to stdout
            args.push('-o', '-');

            // Add the URL as the last argument
            args.push(url);

            console.log(`Executing audio download: ${YT_DLP_PATH} ${args.join(' ')}`);

            // Create a new ReadableStream for audio downloads
            const stream = new ReadableStream({
                start(controller) {
                    // Spawn yt-dlp process
                    const process = spawn(YT_DLP_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

                    // Handle stdout data
                    process.stdout.on('data', (chunk) => {
                        controller.enqueue(chunk);
                    });

                    // Handle stderr data (for logging)
                    process.stderr.on('data', (data) => {
                        console.error(`yt-dlp stderr: ${data}`);
                    });

                    // Handle process completion
                    process.on('close', (code) => {
                        console.log(`yt-dlp process exited with code ${code}`);
                        if (code !== 0) {
                            controller.error(new Error(`yt-dlp process exited with code ${code}`));
                        } else {
                            controller.close();
                        }
                    });

                    // Handle process errors
                    process.on('error', (err) => {
                        console.error('Failed to start yt-dlp process:', err);
                        controller.error(err);
                    });
                }
            });

            // Set headers for audio
            const headers = new Headers();
            const safeFilename = sanitizeFilename(videoTitle, 'mp3');
            headers.set('Content-Type', 'audio/mpeg');
            headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);

            // Return streaming response for audio
            return new Response(stream, {
                headers,
            });
        } else {
            // For videos, we need to ensure QuickTime compatibility

            // Step 1: First download to a temporary file
            const tempFile = path.join(os.tmpdir(), `yt-download-${Date.now()}.mp4`);

            // Step 2: Define the base format selection
            if (format) {
                args.push('--format', `${format}+bestaudio/best`);
            } else {
                // Select best format compatible with QuickTime
                args.push('--format', 'bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc1]/best[ext=mp4]/best');
            }

            // Step 3: Save to temp file instead of stdout
            args.push('--merge-output-format', 'mp4');
            args.push('-o', tempFile);

            // Step 4: Add the URL as the last argument
            args.push(url);

            console.log(`Executing download step: ${YT_DLP_PATH} ${args.join(' ')}`);

            try {
                // Execute yt-dlp to download the file
                const downloadProcess = spawn(YT_DLP_PATH, args);

                await new Promise<void>((resolve, reject) => {
                    downloadProcess.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error(`yt-dlp download process exited with code ${code}`));
                        }
                    });

                    downloadProcess.on('error', (err) => {
                        reject(err);
                    });

                    // Log stderr for debugging
                    downloadProcess.stderr.on('data', (data) => {
                        console.error(`yt-dlp stderr: ${data}`);
                    });
                });

                // Set appropriate headers
                const headers = new Headers();
                const safeFilename = sanitizeFilename(videoTitle, 'mp4');
                headers.set('Content-Type', 'video/mp4');
                headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);

                // Create a readable stream from the file
                const fileStream = fs.createReadStream(tempFile);

                // Return streaming response
                const response = new Response(fileStream as any, { headers });

                // Delete the temporary file after the response is sent
                // This is a workaround since Response doesn't have .finally()
                setTimeout(() => {
                    fs.unlink(tempFile, (err) => {
                        if (err) console.error(`Failed to delete temp file ${tempFile}:`, err);
                        else console.log(`Successfully deleted temp file ${tempFile}`);
                    });
                }, 60000); // Give 1 minute for the download to complete

                return response;
            } catch (error) {
                console.error('Error in download process:', error);
                throw error;
            }
        }
    } catch (error) {
        console.error('Error in stream route handler:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 