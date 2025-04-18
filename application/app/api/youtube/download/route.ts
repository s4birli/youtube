import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { z } from 'zod';
import { downloadVideo, getDownloadProgress, getDownloadProgressData } from '../../../services/youtube-service';

// Validate request body schema
const requestSchema = z.object({
    videoUrl: z.string().url('Invalid video URL'),
    formatId: z.string().optional(),
    quality: z.string().optional(),
    extractAudio: z.boolean().optional(),
    audioFormat: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request body
        const result = requestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { message: result.error.errors[0].message },
                { status: 400 }
            );
        }

        // Ensure videoUrl is provided (required by DownloadRequest type)
        if (!result.data.videoUrl) {
            return NextResponse.json(
                { message: 'Video URL is required' },
                { status: 400 }
            );
        }

        // Download video - passing the validated data which always has videoUrl
        const downloadResponse = await downloadVideo({
            videoUrl: result.data.videoUrl,
            formatId: result.data.formatId,
            quality: result.data.quality,
            extractAudio: result.data.extractAudio,
            audioFormat: result.data.audioFormat
        });

        // Return response
        return NextResponse.json(downloadResponse);
    } catch (error) {
        console.error('Error in /api/youtube/download:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 