import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from './components/Header';
import Footer from './components/Footer';
import CleanupServiceInitializer from './components/CleanupServiceInitializer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'YouTube Downloader',
    description: 'Download videos from YouTube in various formats and qualities',
    icons: {
        icon: [
            {
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="favicon-svg"><path fill="%23FF0000" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>',
                type: 'image/svg+xml',
                sizes: 'any'
            },
            '/favicon.ico'
        ],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg-primary`}>
                <Providers>
                    <Header />
                    <main className="flex-grow container mx-auto px-4 py-8">
                        {children}
                    </main>
                    <Footer />
                    <CleanupServiceInitializer />
                </Providers>
            </body>
        </html>
    );
} 