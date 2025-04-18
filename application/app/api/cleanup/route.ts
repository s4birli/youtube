import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Time threshold in milliseconds (3 hours)
const TIME_THRESHOLD = 3 * 60 * 60 * 1000;

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'data');

        // Check if directory exists
        if (!fs.existsSync(dataDir)) {
            return NextResponse.json({ message: 'Data directory does not exist' }, { status: 404 });
        }

        const files = fs.readdirSync(dataDir);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            // Skip .DS_Store and other hidden files
            if (file.startsWith('.')) continue;

            const filePath = path.join(dataDir, file);
            const stats = fs.statSync(filePath);

            // Delete files older than threshold
            if (now - stats.mtimeMs > TIME_THRESHOLD) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }

        return NextResponse.json({ message: `Deleted ${deletedCount} old files` }, { status: 200 });
    } catch (error) {
        console.error('Error during cleanup:', error);
        return NextResponse.json({ message: 'Cleanup failed', error: (error as Error).message }, { status: 500 });
    }
} 