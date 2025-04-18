/**
 * Cleanup service for deleting old files every 3 minutes
 */
import fs from 'fs';
import path from 'path';

let cleanupInterval: NodeJS.Timeout | null = null;

// Time threshold in milliseconds (3 hours)
const TIME_THRESHOLD = 3 * 60 * 60 * 1000;

/**
 * Start the cleanup service
 */
export function startCleanupService() {
    if (cleanupInterval) {
        return; // Already running
    }

    // Only run on the client side
    if (typeof window === 'undefined') {
        return;
    }

    // Run immediately once
    runCleanup();

    // Then run every 3 minutes
    cleanupInterval = setInterval(runCleanup, 3 * 60 * 1000);
    console.log('File cleanup service started - running every 3 minutes');
}

/**
 * Stop the cleanup service
 */
export function stopCleanupService() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('File cleanup service stopped');
    }
}

/**
 * Run the cleanup operation
 */
async function runCleanup() {
    try {
        console.log('Running file cleanup...');

        // Use server endpoint to clean up files
        const response = await fetch('/api/cleanup', {
            method: 'GET',
            cache: 'no-store',
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Cleanup completed:', data.message);
        } else {
            console.error('Cleanup failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
} 