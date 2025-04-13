import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppError } from '../utils/error';
import { logger } from '../utils/logger';

// Function to write cookies to file
const writeCookieFile = async (cookies: string, format: 'json' | 'netscape' = 'json'): Promise<string> => {
    try {
        const cookiesDir = path.resolve(process.cwd());

        if (format === 'json') {
            // Save the JSON cookies directly
            const jsonPath = path.join(cookiesDir, 'youtube_cookies.json');
            await fs.promises.writeFile(jsonPath, cookies);

            // Now convert to Netscape format using our existing script
            const { convertJsonToNetscape } = require('../scripts/cookie-converter');
            await convertJsonToNetscape('youtube_cookies.json', 'youtube_cookies.txt');

            return jsonPath;
        } else {
            // Save directly as Netscape format
            const txtPath = path.join(cookiesDir, 'youtube_cookies.txt');
            await fs.promises.writeFile(txtPath, cookies);
            return txtPath;
        }
    } catch (error) {
        logger.error('Error writing cookie file:', error);
        throw new AppError('Failed to save cookie file', 500);
    }
};

// POST /api/cookies/youtube - Save YouTube cookies
export const saveYouTubeCookies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cookieText } = req.body;

        if (!cookieText) {
            throw new AppError('Cookie text is required', 400);
        }

        // Determine format and save accordingly
        let format: 'json' | 'netscape' = 'json';

        // Check if it's already in Netscape format
        if (cookieText.includes('# Netscape HTTP Cookie File') ||
            /^.[^{].*\t.*\t.*\t.*\t.*\t.*\t.*$/.test(cookieText.split('\n')[0])) {
            format = 'netscape';
        }

        const filePath = await writeCookieFile(cookieText, format);
        logger.info(`Saved YouTube cookies to ${filePath}`);

        res.status(200).json({
            success: true,
            message: 'YouTube cookies saved successfully'
        });
    } catch (error) {
        logger.error('Error in saveYouTubeCookies:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'An unexpected error occurred'
            });
        }
    }
}; 