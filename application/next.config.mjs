/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    env: {
        DOWNLOAD_TEMP_DIR: './data',
        MAX_CONCURRENT_DOWNLOADS: '5',
        CLEANUP_INTERVAL_MINUTES: '60',
        MAX_FILE_AGE_HOURS: '24',
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
};

export default nextConfig; 