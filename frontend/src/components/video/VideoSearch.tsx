import { useState, memo, useEffect } from 'react';
import { YoutubeService } from '../../services/api';
import { YoutubeFrontendService } from '../../youtube-frontend';
import { VideoResponse } from '../../types/video.types';

interface VideoSearchProps {
    initialValue?: string;
    onVideoInfo?: (data: VideoResponse) => void;
    onError?: (message: string) => void;
    onLoadingChange?: (loading: boolean) => void;
}

const VideoSearch = ({
    initialValue = '',
    onVideoInfo = () => { },
    onError = () => { },
    onLoadingChange = () => { }
}: VideoSearchProps) => {
    const [url, setUrl] = useState(initialValue);
    const [inputError, setInputError] = useState('');
    const [useFrontendAPI, setUseFrontendAPI] = useState(false);

    // Update url when initialValue changes
    useEffect(() => {
        if (initialValue && initialValue !== url) {
            setUrl(initialValue);
        }
    }, [initialValue, url]);

    const validateYoutubeUrl = (url: string): boolean => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return pattern.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            setInputError('Please enter a YouTube URL');
            return;
        }

        if (!validateYoutubeUrl(url)) {
            setInputError('Please enter a valid YouTube URL');
            return;
        }

        setInputError('');
        onLoadingChange(true);

        // Try frontend API first if enabled
        if (useFrontendAPI) {
            try {
                const videoInfo = await YoutubeFrontendService.getVideoInfo(url);
                onVideoInfo(videoInfo);
                return;
            } catch (frontendError) {
                console.error('Frontend API error:', frontendError);
                // Continue to try backend as fallback
            } finally {
                onLoadingChange(false);
            }
        } else {
            // Use backend API
            try {
                const videoInfo = await YoutubeService.getVideoInfo(url);

                if (!videoInfo || !videoInfo.videoDetails) {
                    throw new Error('Invalid response format from server');
                }

                onVideoInfo(videoInfo);
            } catch (error) {
                console.error('Error fetching video info:', error);

                // If backend fails with authentication error, suggest frontend API
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video information';

                if (errorMessage.toLowerCase().includes('sign in') ||
                    errorMessage.toLowerCase().includes('authentication') ||
                    errorMessage.toLowerCase().includes('bot')) {

                    // Auto-switch to frontend API and retry
                    setUseFrontendAPI(true);
                    onError(`${errorMessage} - Switching to frontend mode...`);

                    // Retry with frontend API
                    try {
                        const videoInfo = await YoutubeFrontendService.getVideoInfo(url);
                        onVideoInfo(videoInfo);
                        return;
                    } catch (frontendError) {
                        console.error('Frontend API retry failed:', frontendError);
                        onError(`${errorMessage} - Please try our cookie helper to fix authentication.`);
                    }
                } else {
                    onError(errorMessage);
                }
            } finally {
                onLoadingChange(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            {/* Google-style search input */}
            <div className="relative">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Enter YouTube video URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className={`w-full py-4 px-5 pr-12 border ${inputError ? 'border-red-500' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent shadow-sm hover:shadow-md transition-shadow`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {inputError && (
                    <p className="mt-2 text-red-600 text-sm">{inputError}</p>
                )}

                <div className="mt-4 flex justify-center items-center space-x-3">
                    <button
                        type="submit"
                        className="px-5 py-2 bg-youtube-red hover:bg-youtube-darkred text-white rounded-md font-medium text-m transition-colors w-36"
                    >
                        Get Info
                    </button>

                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useFrontendAPI}
                            onChange={() => setUseFrontendAPI(!useFrontendAPI)}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-youtube-red rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-youtube-red"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Frontend Mode
                        </span>
                    </label>
                </div>
            </div>
        </form>
    );
};

export default memo(VideoSearch); 