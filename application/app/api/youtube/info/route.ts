import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo } from '../../../services/youtube-service';
import { z } from 'zod';

// Validate request body schema
const requestSchema = z.object({
    url: z.string().url('Invalid URL format'),
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

        // Get video URL from validated body
        const { url } = result.data;

        // Get video info
        const videoInfo = await getVideoInfo(url);

        // Return response
        return NextResponse.json(videoInfo);
    } catch (error) {
        console.error('Error in /api/youtube/info:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 