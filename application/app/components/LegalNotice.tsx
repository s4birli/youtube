'use client';

import { useState } from 'react';

export default function LegalNotice() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Legal Notice</h3>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {expanded ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {expanded && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p>
                        This tool is designed for downloading content for which you have the legal right to download, such as:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Content you created and uploaded</li>
                        <li>Content under Creative Commons licenses</li>
                        <li>Content in the public domain</li>
                        <li>Content where the copyright holder has granted permission for downloading</li>
                    </ul>
                    <p className="mt-3">
                        Downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable copyright laws.
                        You are responsible for ensuring your use of this tool complies with all legal requirements in your jurisdiction.
                    </p>
                    <p className="mt-3">
                        This service does not store copies of downloaded content or track your usage beyond what's needed to process your request.
                    </p>
                </div>
            )}
        </div>
    );
} 