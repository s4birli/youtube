import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import { getDownloadProgress, getDownloadProgressData } from '../../../../services/youtube-service';

// GET route to serve downloaded files
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        console.log(`Download requested for ID: ${id}`);

        if (!id) {
            console.log('Download ID missing in request');
            return NextResponse.json(
                { message: 'Download ID is required' },
                { status: 400 }
            );
        }

        // Get download progress info
        const progress = await getDownloadProgress(id);
        console.log(`Download progress for ID ${id}: Status = ${progress.status}, Progress = ${progress.progress}`);

        // Get the download data - this might contain the direct URL
        const downloadProgressData = await getDownloadProgressData(id);
        console.log('Download progress data:', downloadProgressData);

        // Handle various status cases with appropriate error messages
        if (progress.status === 'not_found') {
            console.log(`No download record found with ID: ${id}`);
            return NextResponse.json(
                { message: 'Download not found. The download might have expired or was never created.' },
                { status: 404 }
            );
        }

        // Handle case where the format has a direct URL - this is the important part for direct audio URLs
        if (downloadProgressData?.directUrl) {
            console.log(`Direct URL found for download ${id}, redirecting to: ${downloadProgressData.directUrl}`);
            return Response.redirect(downloadProgressData.directUrl, 302);
        }

        if (progress.status === 'failed') {
            console.log(`Download with ID ${id} previously failed. Error: ${progress.error || 'Unknown error'}`);
            return NextResponse.json(
                {
                    message: 'Download previously failed',
                    error: progress.error || 'Unknown download error',
                    status: progress.status
                },
                { status: 400 }
            );
        }

        if (progress.status !== 'completed') {
            console.log(`Download with ID ${id} is not completed yet. Current status: ${progress.status}`);
            return NextResponse.json(
                {
                    message: `Download not ready. Current status: ${progress.status}`,
                    progress: progress.progress,
                    status: progress.status
                },
                { status: 202 }
            );
        }

        // Get the download data from the in-memory store
        const downloadDir = process.env.DOWNLOAD_TEMP_DIR || './data';
        console.log(`Looking for file in download directory: ${downloadDir}`);

        // Use filepath from progress data if available
        if (downloadProgressData?.filepath) {
            try {
                const stats = await fs.stat(downloadProgressData.filepath);
                if (stats.isFile() && stats.size > 0) {
                    console.log(`Using saved file path: ${downloadProgressData.filepath}`);

                    // Extract filename from path
                    const fileName = path.basename(downloadProgressData.filepath);

                    // Determine content type based on file extension
                    const ext = path.extname(downloadProgressData.filepath).toLowerCase();
                    const contentType = ext === '.mp3'
                        ? 'audio/mpeg'
                        : ext === '.mp4'
                            ? 'video/mp4'
                            : ext === '.webm'
                                ? 'video/webm'
                                : 'application/octet-stream';

                    // Sanitize original title if available
                    const url = new URL(request.url);
                    let sanitizedFileName = url.searchParams.get('title');

                    if (!sanitizedFileName && downloadProgressData?.title) {
                        sanitizedFileName = downloadProgressData.title
                            .replace(/[^\w\s.-]/g, '') // Remove special characters
                            .replace(/\s+/g, '_')      // Replace spaces with underscores
                            + ext;
                    } else if (sanitizedFileName) {
                        sanitizedFileName = sanitizedFileName + ext;
                    } else {
                        sanitizedFileName = fileName;
                    }

                    // Read and return the file
                    try {
                        const fileBuffer = await fs.readFile(downloadProgressData.filepath);
                        console.log(`Successfully read file: ${downloadProgressData.filepath} (${fileBuffer.length} bytes)`);

                        return new NextResponse(fileBuffer, {
                            headers: {
                                'Content-Type': contentType,
                                'Content-Length': stats.size.toString(),
                                'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
                                'Cache-Control': 'no-cache',
                            },
                        });
                    } catch (error) {
                        console.error(`Error reading file ${downloadProgressData.filepath}:`, error);
                    }
                } else {
                    console.log(`Saved file path exists but is invalid: ${downloadProgressData.filepath}`);
                }
            } catch (error) {
                console.error(`Error accessing saved file path ${downloadProgressData.filepath}:`, error);
            }
        }

        // Fall back to looking for the file in the download directory
        console.log(`Falling back to searching for file by ID prefix in ${downloadDir}`);

        // Make sure the download directory exists
        try {
            await fs.access(downloadDir);
        } catch (error) {
            console.error(`Download directory ${downloadDir} does not exist or is not accessible:`, error);
            return NextResponse.json(
                { message: 'Download directory not available' },
                { status: 500 }
            );
        }

        // Find the file in the download directory
        let files;
        try {
            files = await fs.readdir(downloadDir);
            console.log(`Found ${files.length} files in download directory`);
            console.log('Files:', files);
        } catch (error) {
            console.error(`Unable to read download directory ${downloadDir}:`, error);
            return NextResponse.json(
                { message: 'Unable to access download files' },
                { status: 500 }
            );
        }

        const downloadFile = files.find(file => file.startsWith(id));

        if (!downloadFile) {
            console.error(`No file found with ID prefix ${id} in directory ${downloadDir}`);
            console.log('Available files:', files);
            return NextResponse.json(
                { message: 'File not found in download directory' },
                { status: 404 }
            );
        }

        console.log(`Found matching file: ${downloadFile}`);
        const filePath = path.join(downloadDir, downloadFile);

        // Check if file exists and is readable
        try {
            await fs.access(filePath, fsConstants.R_OK);
        } catch (error) {
            console.error(`File ${filePath} exists but is not readable:`, error);
            return NextResponse.json(
                { message: 'File exists but cannot be accessed' },
                { status: 500 }
            );
        }

        const stats = await fs.stat(filePath);

        if (stats.size === 0) {
            console.error(`File ${filePath} exists but is empty (0 bytes)`);
            return NextResponse.json(
                { message: 'File exists but is empty' },
                { status: 500 }
            );
        }

        // Determine content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentType = ext === '.mp3'
            ? 'audio/mpeg'
            : ext === '.mp4'
                ? 'video/mp4'
                : ext === '.webm'
                    ? 'video/webm'
                    : 'application/octet-stream';

        // Get sanitized filename from request or use the original filename
        // Extract video title from URL search params if available
        const url = new URL(request.url);
        let fileName = url.searchParams.get('title');

        // If no title in URL, try to use the title from progress data, or fallback to download file name
        if (!fileName && downloadProgressData?.title) {
            fileName = downloadProgressData.title
                .replace(/[^\w\s.-]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                + ext; // Add the correct extension
        } else if (!fileName) {
            fileName = downloadFile;
        } else {
            // Sanitize the filename
            fileName = fileName
                .replace(/[^\w\s.-]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                + ext; // Add the correct extension
        }

        // Create file buffer
        let fileBuffer;
        try {
            fileBuffer = await fs.readFile(filePath);
            console.log(`Successfully read file: ${filePath} (${fileBuffer.length} bytes)`);
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return NextResponse.json(
                { message: 'Error reading file data' },
                { status: 500 }
            );
        }

        // Return the file as a downloadable response
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error('Error in GET /api/youtube/download/{id}:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 