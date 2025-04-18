import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const AboutPage = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-youtube-black dark:text-dark-text-primary">
                    About YouTube Downloader
                </h1>

                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                        What is YouTube Downloader?
                    </h2>
                    <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                        YouTube Downloader is a free web application that allows you to download videos from YouTube in various formats and qualities.
                        It's designed to be simple, fast, and user-friendly, providing a convenient way to save videos for offline viewing.
                    </p>
                    <p className="text-youtube-gray dark:text-dark-text-secondary">
                        This tool is built with modern web technologies including React, Node.js, and TypeScript,
                        offering a responsive design that works seamlessly across desktop and mobile devices.
                    </p>
                </div>

                {/* Support Section */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                        Support This Project
                    </h2>
                    <p className="text-youtube-gray dark:text-dark-text-secondary mb-6">
                        YouTube Downloader is a free tool that takes time and resources to maintain. If you find it useful, please consider supporting the project through one of the following options:
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        <a
                            href="https://www.buymeacoffee.com/s4birli"
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
                            href="https://ko-fi.com/s4birli"
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
                            href="https://github.com/sponsors/s4birli"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-4 py-2 bg-[#2A3039] text-white rounded-lg text-sm font-semibold hover:bg-[#383F4A] transition-colors"
                        >
                            <FontAwesomeIcon icon={faGithub} className="text-base mr-1" />
                            <span>Sponsor on GitHub</span>
                        </a>
                    </div>

                    <p className="text-youtube-gray dark:text-dark-text-secondary text-sm text-center">
                        Your support helps keep this service free and ad-free for everyone!
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                        Features
                    </h2>
                    <ul className="list-disc pl-6 text-youtube-gray dark:text-dark-text-secondary space-y-2">
                        <li>Download videos in multiple formats (MP4, WebM, MP3, etc.)</li>
                        <li>Choose from various quality options (4K, 1080p, 720p, etc.)</li>
                        <li>Extract audio from videos</li>
                        <li>Dark mode support</li>
                        <li>Responsive design for all devices</li>
                        <li>No registration required</li>
                        <li>No ads or popups</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                        How It Works
                    </h2>
                    <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                        Our service uses the YouTube API to fetch video information and provide download links.
                        When you enter a YouTube URL, our server retrieves the available formats and quality options,
                        allowing you to choose the one that best suits your needs.
                    </p>
                    <p className="text-youtube-gray dark:text-dark-text-secondary">
                        All downloads are processed securely on our servers and delivered directly to your device.
                        We don't store the videos on our servers, ensuring your privacy and compliance with YouTube's terms of service.
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                        Legal Disclaimer
                    </h2>
                    <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                        YouTube Downloader is designed for personal use only. Please respect copyright laws and YouTube's terms of service.
                        We do not encourage downloading content that violates copyright or other intellectual property rights.
                    </p>
                    <p className="text-youtube-gray dark:text-dark-text-secondary">
                        This service is not affiliated with YouTube, Google Inc., or any of their affiliates or partners.
                        "YouTube" is a trademark of Google Inc.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default memo(AboutPage); 