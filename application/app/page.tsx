import VideoSearch from './components/VideoSearch';
import HowToUse from './components/HowToUse';
import SponsorSection from './components/SponsorSection';
import LegalNotice from './components/LegalNotice';

export default function HomePage() {
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
                    <VideoSearch />
                </div>

                {/* How to use section */}
                <div className="mt-16 text-center w-full max-w-4xl">
                    <HowToUse />
                </div>

                {/* Sponsor Section */}
                <div className="mt-16 w-full max-w-3xl">
                    <SponsorSection />
                </div>
            </div>

            {/* Add Legal Notice at the bottom of the page */}
            <LegalNotice />
        </div>
    );
} 