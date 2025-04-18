import axios from 'axios';
import { VideoInfo } from '../domain/video';
import { logger } from '../config/logger';

/**
 * Fallback service to get video information when yt-dlp fails
 * This uses direct HTTP calls and various APIs
 */
export class VideoFallbackService {
    /**
     * Use the Invidious API (alternative frontend) to get video info
     */
    public static async getVideoInfoFromInvidious(videoId: string): Promise<VideoInfo | null> {
        try {
            logger.info(`Trying fallback: Invidious API for video ${videoId}`);

            // List of public Invidious instances
            const instances = [
                'https://invidious.snopyta.org',
                'https://invidio.us',
                'https://invidious.kavin.rocks',
                'https://yewtu.be',
                'https://invidious.tube'
            ];

            // Try each instance until one works
            for (const instance of instances) {
                try {
                    logger.debug(`Trying Invidious instance: ${instance}`);

                    const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
                        timeout: 5000, // 5 second timeout
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    });

                    if (response.status === 200 && response.data) {
                        logger.info(`Successfully got video info from Invidious instance: ${instance}`);

                        // Transform to our VideoInfo format
                        const invidiousData = response.data;

                        const videoInfo: Partial<VideoInfo> = {
                            id: invidiousData.videoId,
                            title: invidiousData.title,
                            description: invidiousData.description,
                            webpage_url: `https://www.youtube.com/watch?v=${invidiousData.videoId}`,
                            duration: invidiousData.lengthSeconds,
                            upload_date: invidiousData.publishedText,
                            uploader: invidiousData.author,
                            view_count: invidiousData.viewCount,
                            thumbnails: invidiousData.videoThumbnails?.map((thumb: any) => ({
                                url: thumb.url,
                                height: thumb.height,
                                width: thumb.width
                            })) || [],
                            formats: [],
                            // Add other fields as needed
                        };

                        return videoInfo as VideoInfo;
                    }
                } catch (error) {
                    logger.debug(`Failed to get data from ${instance}: ${error instanceof Error ? error.message : String(error)}`);
                    // Continue to next instance
                }
            }

            logger.warn('All Invidious instances failed');
            return null;
        } catch (error) {
            logger.error(`Error in getVideoInfoFromInvidious: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Use a direct YouTube page scraping approach as a last resort
     */
    public static async getVideoInfoFromYouTubeDirect(videoId: string): Promise<VideoInfo | null> {
        try {
            logger.info(`Trying fallback: Direct YouTube scraping for video ${videoId}`);

            const url = `https://www.youtube.com/watch?v=${videoId}`;

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml'
                }
            });

            if (response.status === 200) {
                const html = response.data;

                // Extract video title
                const titleMatch = html.match(/<title>([^<]*)<\/title>/);
                let title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Unknown Title';

                // Basic videoInfo with limited information
                const videoInfo: Partial<VideoInfo> = {
                    id: videoId,
                    title: title,
                    webpage_url: url,
                    formats: [],
                    thumbnails: [
                        {
                            url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                            id: 'maxresdefault',
                            height: 720,
                            width: 1280
                        },
                        {
                            url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                            id: 'hqdefault',
                            height: 360,
                            width: 480
                        }
                    ]
                };

                logger.info(`Successfully retrieved basic info through direct scraping for video ${videoId}`);
                return videoInfo as VideoInfo;
            }

            return null;
        } catch (error) {
            logger.error(`Error in getVideoInfoFromYouTubeDirect: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
} 