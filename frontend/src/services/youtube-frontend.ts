import { VideoResponse, VideoFormat, VideoDetails } from '../types/video.types';

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
                viewCount: '0',
                thumbnails: [{
                    url: basicInfo.thumbnail_url,
                    height: 480,
                    width: 640
                }]
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
     * Direct download implementation without external redirects
     * Uses our backend API to proxy the download
     * @param videoId YouTube video ID
     * @param formatId Format ID to download
     */
    async downloadVideo(videoId: string, formatId: string): Promise<string> {
        try {
            // Show loading indicator to user
            const downloadStatus = document.createElement('div');
            downloadStatus.className = 'download-status';
            downloadStatus.innerHTML = `
                <div class="download-modal">
                    <div class="download-progress">
                        <div class="spinner"></div>
                        <div class="status-text">Preparing your download...</div>
                    </div>
                </div>
            `;

            // Add some styles for the modal
            const styleEl = document.createElement('style');
            styleEl.innerHTML = `
                .download-status {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .download-modal {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .status-text {
                    font-size: 16px;
                    margin-top: 10px;
                }
                .download-actions {
                    margin-top: 20px;
                }
                .download-actions button {
                    padding: 8px 16px;
                    border: none;
                    background: #3498db;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 5px;
                }
                .download-actions button.cancel {
                    background: #e74c3c;
                }
            `;

            document.body.appendChild(styleEl);
            document.body.appendChild(downloadStatus);

            // Get API base URL from environment
            const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

            // Determine if it's an audio or video format
            const isAudio = formatId.includes('mp3');

            // Build the appropriate URL
            const apiEndpoint = isAudio
                ? `${apiBaseUrl}/youtube/download-mp3`
                : `${apiBaseUrl}/youtube/download`;

            // Create request payload based on format
            const payload = isAudio
                ? { url: `https://www.youtube.com/watch?v=${videoId}` }
                : {
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    formatId: formatId
                };

            // Make API request to start download process
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const downloadData = await response.json();

            // Update status message
            const statusText = downloadStatus.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = 'Processing your download...';
            }

            // Poll for progress
            const checkProgress = async () => {
                try {
                    const progressResponse = await fetch(`${apiBaseUrl}/youtube/progress/${downloadData.id}`);
                    if (!progressResponse.ok) {
                        throw new Error('Failed to check progress');
                    }

                    const progressData = await progressResponse.json();

                    // Update progress UI
                    if (statusText) {
                        statusText.textContent = `Download progress: ${Math.round(progressData.progress)}%`;
                    }

                    // Check if download is complete
                    if (progressData.status === 'completed') {
                        // Get the download URL
                        const downloadUrl = `${window.location.origin}${apiBaseUrl}/youtube/download/${downloadData.id}`;

                        // Update UI for completed download
                        const downloadContainer = downloadStatus.querySelector('.download-progress');
                        if (downloadContainer) {
                            downloadContainer.innerHTML = `
                                <h3>Download Ready!</h3>
                                <p>Your ${isAudio ? 'audio' : 'video'} download is ready.</p>
                                <div class="download-actions">
                                    <button class="download-now">Download Now</button>
                                    <button class="cancel">Close</button>
                                </div>
                            `;

                            // Add click event for download button
                            const downloadBtn = downloadContainer.querySelector('.download-now');
                            if (downloadBtn) {
                                downloadBtn.addEventListener('click', () => {
                                    // Create an invisible link and click it to download
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = downloadData.fileName || `youtube-download-${videoId}.${isAudio ? 'mp3' : 'mp4'}`;
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                });
                            }

                            // Add click event for cancel button
                            const cancelBtn = downloadContainer.querySelector('.cancel');
                            if (cancelBtn) {
                                cancelBtn.addEventListener('click', () => {
                                    document.body.removeChild(downloadStatus);
                                    document.body.removeChild(styleEl);
                                });
                            }
                        }

                        return downloadUrl;
                    } else if (progressData.status === 'failed') {
                        throw new Error(progressData.error || 'Download failed');
                    } else {
                        // Continue polling
                        setTimeout(checkProgress, 1000);
                    }
                } catch (error: any) {
                    // Handle error in polling
                    if (statusText) {
                        statusText.textContent = `Error: ${error.message || 'Unknown error'}`;
                    }

                    // Add a close button
                    const downloadContainer = downloadStatus.querySelector('.download-progress');
                    if (downloadContainer) {
                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'download-actions';
                        actionsDiv.innerHTML = '<button class="cancel">Close</button>';
                        downloadContainer.appendChild(actionsDiv);

                        const closeBtn = actionsDiv.querySelector('.cancel');
                        if (closeBtn) {
                            closeBtn.addEventListener('click', () => {
                                document.body.removeChild(downloadStatus);
                                document.body.removeChild(styleEl);
                            });
                        }
                    }
                }
            };

            // Start polling
            setTimeout(checkProgress, 1000);

            return downloadData.id;
        } catch (error: any) {
            console.error('Download error:', error);

            // Create a simple error notification
            const errorNotification = document.createElement('div');
            errorNotification.style.position = 'fixed';
            errorNotification.style.top = '20px';
            errorNotification.style.left = '50%';
            errorNotification.style.transform = 'translateX(-50%)';
            errorNotification.style.background = '#f44336';
            errorNotification.style.color = 'white';
            errorNotification.style.padding = '12px 20px';
            errorNotification.style.borderRadius = '4px';
            errorNotification.style.zIndex = '10000';
            errorNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            errorNotification.textContent = `Download failed: ${error.message || 'Unknown error'}`;

            document.body.appendChild(errorNotification);

            // Remove notification after 5 seconds
            setTimeout(() => {
                if (document.body.contains(errorNotification)) {
                    document.body.removeChild(errorNotification);
                }
            }, 5000);

            throw error;
        }
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