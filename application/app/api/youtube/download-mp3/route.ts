import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { downloadMP3 } from '../../../services/youtube-service';

// Validate request body schema
const requestSchema = z.object({
    url: z.string().url('Invalid video URL'),
    title: z.string().optional(),
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

        // Ensure url is provided
        if (!result.data.url) {
            return NextResponse.json(
                { message: 'Video URL is required' },
                { status: 400 }
            );
        }

        console.log(`Starting MP3 download for URL: ${result.data.url}${result.data.title ? `, Title: ${result.data.title}` : ''}`);

        // Download video as MP3 with the validated URL and title if provided
        const downloadResponse = await downloadMP3(result.data.url, result.data.title);

        console.log(`MP3 download complete. ID: ${downloadResponse.id}, Path: ${downloadResponse.downloadUrl}`);

        // Return response
        return NextResponse.json(downloadResponse);
    } catch (error) {
        console.error('Error in /api/youtube/download-mp3:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 