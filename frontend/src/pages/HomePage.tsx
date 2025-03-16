import { memo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import VideoSearch from '../components/video/VideoSearch';
import VideoInfo from '../components/video/VideoInfo';
import { VideoResponse } from '../types/video.types';

const HomePage = () => {
    const [searchParams] = useSearchParams();
    const initialVideoUrl = searchParams.get('v') || '';
    const [videoData, setVideoData] = useState<VideoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('Current state:', {
            videoData,
            isLoading,
            error,
            initialVideoUrl
        });
    }, [videoData, isLoading, error, initialVideoUrl]);

    const handleVideoInfo = (data: VideoResponse) => {
        console.log('handleVideoInfo called with data:', data);
        setVideoData(data);
        setError(null);
    };

    const handleError = (message: string) => {
        console.log('handleError called with message:', message);
        setError(message);
        setVideoData(null);
    };

    const handleLoadingChange = (loading: boolean) => {
        console.log('handleLoadingChange called with loading:', loading);
        setIsLoading(loading);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-8 w-full max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 flex justify-center items-center gap-3">
                        <span className="text-youtube-red">YouTube</span>
                        <span className="text-gray-800 dark:text-dark-text-primary">Downloader</span>
                    </h1>
                    <p className="text-youtube-gray dark:text-dark-text-secondary text-lg">
                        Download videos from YouTube in various formats and qualities
                    </p>
                </div>

                <div className="w-full max-w-3xl">
                    <VideoSearch
                        initialValue={initialVideoUrl}
                        onVideoInfo={handleVideoInfo}
                        onError={handleError}
                        onLoadingChange={handleLoadingChange}
                    />
                </div>

                {isLoading && (
                    <div className="mt-8 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-youtube-red"></div>
                    </div>
                )}

                {error && (
                    <div className="mt-8 w-full max-w-3xl p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p>{error}</p>
                    </div>
                )}

                {videoData && !isLoading && (
                    <div className="mt-8 w-full max-w-4xl">
                        <VideoInfo videoData={videoData} />
                    </div>
                )}

                {!videoData && !isLoading && !error && (
                    <div className="mt-16 text-center">
                        <h2 className="text-2xl font-semibold text-youtube-black dark:text-dark-text-primary mb-4">
                            How to use
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
                                <div className="text-youtube-red text-3xl font-bold mb-3">1</div>
                                <h3 className="font-semibold text-lg mb-2 dark:text-dark-text-primary">
                                    Paste YouTube URL
                                </h3>
                                <p className="text-youtube-gray dark:text-dark-text-secondary">
                                    Copy the URL of the YouTube video you want to download and paste it in the search box.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
                                <div className="text-youtube-red text-3xl font-bold mb-3">2</div>
                                <h3 className="font-semibold text-lg mb-2 dark:text-dark-text-primary">
                                    Select Format & Quality
                                </h3>
                                <p className="text-youtube-gray dark:text-dark-text-secondary">
                                    Choose your preferred format (MP4, MP3, etc.) and quality from the available options.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
                                <div className="text-youtube-red text-3xl font-bold mb-3">3</div>
                                <h3 className="font-semibold text-lg mb-2 dark:text-dark-text-primary">
                                    Download Your Video
                                </h3>
                                <p className="text-youtube-gray dark:text-dark-text-secondary">
                                    Click the download button and wait for the download to complete. The file will be saved to your device.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sponsor Section - always visible */}
                <div className="mt-16 w-full max-w-3xl">
                    <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-xl font-semibold text-youtube-black dark:text-dark-text-primary mb-3">
                            Support This Project
                        </h2>
                        <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                            If you find this tool useful, please consider supporting the development!
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <a
                                href="https://www.buymeacoffee.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-4 py-2 bg-[#FFDD00] text-black rounded-lg text-sm font-semibold hover:bg-[#FFED4A] transition-colors"
                            >
                                <img
                                    src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                                    alt="Buy me a coffee"
                                    className="h-4"
                                />
                                <span>Buy me a coffee</span>
                            </a>

                            <a
                                href="https://ko-fi.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-4 py-2 bg-[#13C3FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00B9FF] transition-colors"
                            >
                                <img
                                    src="https://storage.ko-fi.com/cdn/cup-border.png"
                                    alt="Ko-fi"
                                    className="h-4"
                                />
                                <span>Support on Ko-fi</span>
                            </a>

                            <a
                                href="https://github.com/sponsors"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-4 py-2 bg-[#2A3039] text-white rounded-lg text-sm font-semibold hover:bg-[#383F4A] transition-colors"
                            >
                                <FontAwesomeIcon icon={faGithub} className="text-base mr-1" />
                                <span>Sponsor on GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(HomePage); 