'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export default function SponsorSection() {
    return (
        <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-youtube-black dark:text-dark-text-primary mb-3">
                Support This Project
            </h2>
            <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                If you find this tool useful, please consider supporting its development!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
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
        </div>
    );
} 