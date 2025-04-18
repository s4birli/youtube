# YouTube Downloader - Next.js Application

A modern YouTube downloader built with Next.js that combines both the frontend and backend in a single application.

## Features

- Download YouTube videos in various formats and qualities
- Extract audio from videos (MP3)
- Clean, responsive UI with dark mode support
- Server-side rendering for improved performance
- Efficient file handling and cleanup

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State Management**: React Query
- **Backend**: Next.js API Routes
- **Video Processing**: yt-dlp-exec
- **Type Safety**: TypeScript
- **Form Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/youtube-downloader.git
   cd youtube-downloader/application
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Paste a YouTube URL in the search box
2. Select your preferred format and quality
3. Click the download button
4. Wait for the download to complete
5. Click the download link to save the file

## Limitations

- Age-restricted videos cannot be downloaded without authentication
- Some premium content may not be accessible
- Regional restrictions still apply

## Deployment

This application can be deployed to any platform that supports Next.js:

- Vercel (recommended)
- Netlify
- Self-hosted with Node.js

## Environment Variables

Create a `.env.local` file with the following variables:

```
DOWNLOAD_TEMP_DIR=./data
MAX_CONCURRENT_DOWNLOADS=5
CLEANUP_INTERVAL_MINUTES=60
MAX_FILE_AGE_HOURS=24
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for the powerful download engine
- [Next.js](https://nextjs.org/) for the application framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
