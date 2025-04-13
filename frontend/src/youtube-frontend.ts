import { VideoResponse, VideoFormat, VideoDetails } from './types/video.types';

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
    async getFormats(videoId: string): Promise<VideoFormat[]> {
        // Since we cannot directly access YouTube's internal API from the browser,
        // we'll create a set of common formats that are typically available

        return [
            {
                format_id: 'mp4-360p',
                ext: 'mp4',
                url: `https://redirector.example.com/watch?v=${videoId}&quality=360p`,
                resolution: '640x360',
                fps: 30,
                filesize: undefined,
                acodec: 'aac',
                vcodec: 'h264',
                height: 360,
                width: 640,
                normalizedResolution: '360p'
            },
            {
                format_id: 'mp4-720p',
                ext: 'mp4',
                url: `https://redirector.example.com/watch?v=${videoId}&quality=720p`,
                resolution: '1280x720',
                fps: 30,
                filesize: undefined,
                acodec: 'aac',
                vcodec: 'h264',
                height: 720,
                width: 1280,
                normalizedResolution: '720p'
            },
            {
                format_id: 'mp3-128k',
                ext: 'mp3',
                url: `https://redirector.example.com/watch?v=${videoId}&format=mp3`,
                acodec: 'mp3',
                vcodec: 'none',
                filesize: undefined,
                normalizedResolution: 'Audio'
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

            // Create video details object with proper type
            const videoDetails: VideoDetails = {
                id: videoId,
                title: basicInfo.title,
                description: 'Video description not available in frontend mode',
                duration: 0,
                thumbnail: basicInfo.thumbnail_url,
                uploadDate: new Date().toISOString().split('T')[0],
                views: 0,
                author: basicInfo.author_name,
                // Optional fields
                channelId: '',
                viewCount: '0'
            };

            // Create a response that matches the VideoResponse type
            const response: VideoResponse = {
                id: videoId,
                formats: formats,
                videoDetails: videoDetails,
                // Add additional properties
                _frontend_processed: true
            };

            return response;
        } catch (error) {
            console.error('Error in frontend getVideoInfo:', error);
            throw new Error(`Failed to get video information: ${(error as Error).message}`);
        }
    },

    /**
     * Initiates a download via external service
     * This is a placeholder that redirects to a YouTube download service
     */
    async downloadVideo(videoId: string, formatId: string): Promise<string> {
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