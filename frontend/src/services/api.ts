import axios from 'axios';
import {
    VideoResponse,
    DownloadRequest,
    DownloadResponse,
    ProgressInfo
} from '../types/video.types';
import {
    VideoMetadata,
    MetadataResponse,
    MetadataUpdateResponse
} from '../types/metadata.types';

// Create axios instance with base URL and default configs
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// API endpoints
export const API_ENDPOINTS = {
    VIDEO_INFO: '/youtube/info',
    DOWNLOAD: '/youtube/download',
    DOWNLOAD_PROGRESS: '/youtube/progress',
    DOWNLOAD_MP3: '/youtube/download-mp3',
    METADATA: '/metadata',
};

// Error handler function
const handleApiError = (error: unknown): never => {
    // Extract error message from response or use generic message
    let errorMessage: string;

    if (axios.isAxiosError(error) && error.response?.data) {
        errorMessage = (error.response.data as { message?: string }).message || 'API error occurred';
    } else {
        errorMessage = (error as Error)?.message || 'An unknown error occurred';
    }

    // Log error for debugging
    console.error('API Error:', errorMessage, error);

    // Throw with formatted message
    throw new Error(errorMessage);
};

// API service methods
export const YoutubeService = {
    /**
     * Get video information by URL
     * @param url YouTube video URL
     */
    async getVideoInfo(url: string): Promise<VideoResponse> {
        try {
            console.log('API: Sending request to:', API_ENDPOINTS.VIDEO_INFO, 'with data:', { url });
            const response = await api.post(API_ENDPOINTS.VIDEO_INFO, { url });
            console.log('API: Raw response:', response);

            const data = response.data;
            console.log('API: Parsed data:', data);

            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format: Expected an object');
            }

            if (!data.videoDetails || !data.formats || !Array.isArray(data.formats)) {
                console.error('Invalid response structure:', data);
                throw new Error('Invalid response format: Missing required fields');
            }

            return data;
        } catch (error) {
            console.error('API Error in getVideoInfo:', error);
            return handleApiError(error);
        }
    },

    /**
     * Start video download
     * @param downloadRequest Download request containing video URL and format details
     */
    async downloadVideo(downloadRequest: DownloadRequest): Promise<DownloadResponse> {
        try {
            const response = await api.post(API_ENDPOINTS.DOWNLOAD, downloadRequest);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    /**
     * Check download progress
     * @param id Download ID to check progress for
     */
    async getDownloadProgress(id: string): Promise<ProgressInfo> {
        try {
            const response = await api.get(`${API_ENDPOINTS.DOWNLOAD_PROGRESS}/${id}`);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    /**
     * Get direct download URL for completed download
     * @param id Download ID
     */
    async getDownloadUrl(id: string): Promise<string> {
        // Return direct URL to the download endpoint
        return `${api.defaults.baseURL}${API_ENDPOINTS.DOWNLOAD}/${id}`;
    },

    /**
     * Direct MP3 download helper - gets best audio quality in MP3 format
     * @param videoUrl YouTube video URL
     */
    async downloadMP3(videoUrl: string): Promise<DownloadResponse> {
        try {
            // Call the direct MP3 download endpoint
            const response = await api.post(API_ENDPOINTS.DOWNLOAD_MP3, { url: videoUrl });
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    }
};

// Metadata service methods
export const MetadataService = {
    /**
     * Read metadata for a video file
     * @param filePath Path to video file
     */
    async readMetadata(filePath: string): Promise<MetadataResponse> {
        try {
            const response = await api.get(`${API_ENDPOINTS.METADATA}?path=${encodeURIComponent(filePath)}`);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    /**
     * Update metadata for a video file
     * @param filePath Path to video file
     * @param metadata Metadata object with updates
     */
    async updateMetadata(filePath: string, metadata: VideoMetadata): Promise<MetadataUpdateResponse> {
        try {
            const response = await api.post(API_ENDPOINTS.METADATA, {
                path: filePath,
                metadata
            });
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    }
};

export default {
    YoutubeService,
    MetadataService
}; 