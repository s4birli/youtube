'use client';

/**
 * Download a YouTube video or audio using the server-side stream API
 * @param url YouTube URL to download
 * @param options Download options
 */
export async function downloadYouTube(
    url: string,
    options: {
        audioOnly?: boolean;
        format?: string;
        filename?: string;
    } = {}
) {
    try {
        // Default options
        const { audioOnly = false, format, filename } = options;

        // Use a POST request via form submit to avoid URL length limitations
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/stream';
        form.target = '_blank'; // Open in new tab
        form.style.display = 'none';

        // Add the URL as a hidden input
        const urlInput = document.createElement('input');
        urlInput.type = 'hidden';
        urlInput.name = 'url';
        urlInput.value = url;
        form.appendChild(urlInput);

        // Add audioOnly option as hidden input
        const audioOnlyInput = document.createElement('input');
        audioOnlyInput.type = 'hidden';
        audioOnlyInput.name = 'audioOnly';
        audioOnlyInput.value = audioOnly.toString();
        form.appendChild(audioOnlyInput);

        // Add format if provided
        if (format) {
            const formatInput = document.createElement('input');
            formatInput.type = 'hidden';
            formatInput.name = 'format';
            formatInput.value = format;
            form.appendChild(formatInput);
        }

        // Add filename if provided
        if (filename) {
            const filenameInput = document.createElement('input');
            filenameInput.type = 'hidden';
            filenameInput.name = 'filename';
            filenameInput.value = filename;
            form.appendChild(filenameInput);
        }

        // Add the form to the body and submit it
        document.body.appendChild(form);
        form.submit();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(form);
        }, 100);

        return true;
    } catch (error) {
        console.error('Error downloading YouTube content:', error);

        // Try to use the CORS proxy as a fallback (only for very simple cases)
        if (options.audioOnly) {
            alert('Download failed. Trying alternative method...');
            await tryCorsFallback(url, options.filename);
        } else {
            alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return false;
    }
}

/**
 * Fallback method using CORS proxy - only works for some simple cases
 */
async function tryCorsFallback(url: string, filename?: string) {
    try {
        const response = await fetch('/api/cors-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`CORS proxy failed: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'youtube-download.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

        return true;
    } catch (error) {
        console.error('CORS fallback failed:', error);
        alert(`All download methods failed. Please try a different video or contact support.`);
        return false;
    }
} 