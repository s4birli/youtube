export default function HowToUse() {
    return (
        <div>
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
    );
} 