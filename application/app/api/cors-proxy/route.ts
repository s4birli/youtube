import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const requestSchema = z.object({
    url: z.string().url('Invalid URL'),
});

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request body
        const result = requestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { url } = result.data;

        // Fetch content from the target URL
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Target server responded with ${response.status}: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Create a new response with CORS headers
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const data = await response.arrayBuffer();

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return new Response(data, {
            headers,
            status: 200,
        });

    } catch (error) {
        console.error('Error in CORS proxy:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');

    return new Response(null, {
        headers,
        status: 204,
    });
} 