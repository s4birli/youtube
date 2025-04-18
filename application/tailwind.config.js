/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'youtube-red': '#FF0000',
                'youtube-darkred': '#CC0000',
                'youtube-black': '#282828',
                'youtube-gray': '#606060',
                'dark-bg-primary': '#0F0F0F',
                'dark-bg-secondary': '#1F1F1F',
                'dark-text-primary': '#FFFFFF',
                'dark-text-secondary': '#AAAAAA',
            },
            fontFamily: {
                sans: [
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                ],
            },
        },
    },
    plugins: [],
}; 