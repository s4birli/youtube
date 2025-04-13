import { VideoResponse, Format } from '../types/video.types';

/**
 * Frontend YouTube Service - handles YouTube operations directly in the browser
 * This avoids server-side authentication issues by using the user's browser session
 */
export const YoutubeFrontendService = {
    /**
     * Get basic video information using YouTube's oEmbed API
     * @param url YouTube video URL
     */
    async getBasicInfo(url: string): Promise<{
        title: string;
        author_name: string;
        thumbnail_url: string;
        html: string;
        video_id: string;
    }> {
        try {
            // Extract video ID from URL
            const videoId = extractVideoId(url);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Use YouTube's oEmbed API to get basic info
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const response = await fetch(oembedUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch video info: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                ...data,
                video_id: videoId
            };
        } catch (error) {
            console.error('Error getting basic video info:', error);
            throw error;
        }
    },

    /**
     * Get video formats using a lightweight approach that works in the browser
     * @param videoId YouTube video ID
     */
    async getFormats(videoId: string): Promise<Format[]> {
        // Since we cannot directly access YouTube's internal API from the browser,
        // we'll create a set of common formats that are typically available

        return [
            {
                format_id: 'mp4-360p',
                ext: 'mp4',
                format: 'MP4 360p',
                resolution: '640x360',
                fps: 30,
                filesize: null,
                acodec: 'aac',
                vcodec: 'h264',
                asr: 44100,
                quality: 0.5,
                height: 360,
                width: 640
            },
            {
                format_id: 'mp4-720p',
                ext: 'mp4',
                format: 'MP4 720p',
                resolution: '1280x720',
                fps: 30,
                filesize: null,
                acodec: 'aac',
                vcodec: 'h264',
                asr: 44100,
                quality: 0.7,
                height: 720,
                width: 1280
            },
            {
                format_id: 'mp3-128k',
                ext: 'mp3',
                format: 'Audio MP3 128kbps',
                acodec: 'mp3',
                vcodec: 'none',
                asr: 44100,
                filesize: null,
                quality: 0.5
            }
        ];
    },

    /**
     * Get comprehensive video information by combining multiple APIs
     * @param url YouTube video URL
     */
    async getVideoInfo(url: string): Promise<VideoResponse> {
        try {
            // Get basic info using oEmbed
            const basicInfo = await this.getBasicInfo(url);
            const videoId = basicInfo.video_id;

            // Get available formats
            const formats = await this.getFormats(videoId);

            // Create a response similar to what the backend would provide
            const response: VideoResponse = {
                id: videoId,
                title: basicInfo.title,
                description: '', // Not available from oembed
                duration: 0, // Not available from oembed
                uploadDate: '', // Not available from oembed
                uploader: basicInfo.author_name,
                channel: basicInfo.author_name,
                thumbnail: basicInfo.thumbnail_url,
                formats: formats,
                // Mock video details to match expected structure
                videoDetails: {
                    title: basicInfo.title,
                    description: '',
                    lengthSeconds: '0',
                    viewCount: '0',
                    uploadDate: '',
                    author: basicInfo.author_name,
                    channelId: '',
                    thumbnails: [{ url: basicInfo.thumbnail_url, height: 480, width: 640 }]
                },
                // Add unique frontend flag to identify this is coming from frontend
                _frontend_processed: true
            };

            return response;
        } catch (error) {
            console.error('Error in frontend getVideoInfo:', error);
            throw new Error(`Failed to get video information: ${(error as Error).message}`);
        }
    },

    /**
     * Initiates a download via youtube-dl.js in the browser
     * This is a placeholder - actual implementation would require a browser extension
     * or using a third-party API that handles YouTube downloads
     */
    async downloadVideo(videoId: string, format: string): Promise<string> {
        // For security reasons, browsers cannot directly download YouTube videos
        // We'll redirect to a safe downloadable service

        const safeDownloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
        window.open(safeDownloadUrl, '_blank');

        return safeDownloadUrl;
    }
};

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
    if (!url) return null;

    // Handle youtube.com/watch?v= format
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?/]+)/i);
    if (match && match[1]) {
        return match[1];
    }

    // Handle youtu.be/ format
    match = url.match(/youtu\.be\/([^&\?/]+)/i);
    if (match && match[1]) {
        return match[1];
    }

    // Handle youtube.com/embed/ format
    match = url.match(/youtube\.com\/embed\/([^&\?/]+)/i);
    if (match && match[1]) {
        return match[1];
    }

    return null;
} 