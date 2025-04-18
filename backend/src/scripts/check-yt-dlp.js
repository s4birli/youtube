#!/usr/bin/env node

/**
 * Check YT-DLP Installation
 * 
 * This script verifies that yt-dlp is properly installed and accessible
 * when the application starts.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    brightGreen: '\x1b[92m'
};

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.brightGreen}YT-DLP Environment Check${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}`);

// Get environment variables
const ytDlpPath = process.env.YT_DLP_PATH || '/usr/local/bin/yt-dlp';
const ytDlpWrapper = process.env.YT_DLP_WRAPPER || '/usr/local/bin/yt-dlp-wrapper';

console.log(`${colors.blue}Environment:${colors.reset}`);
console.log(`- YT_DLP_PATH: ${ytDlpPath}`);
console.log(`- YT_DLP_WRAPPER: ${ytDlpWrapper}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PATH: ${process.env.PATH}`);

// Check for Python
try {
    console.log(`\n${colors.blue}Checking for Python:${colors.reset}`);
    const pythonOutput = execSync('which python || which python3').toString().trim();
    console.log(`${colors.green}✓ Python found at: ${pythonOutput}${colors.reset}`);
} catch (error) {
    console.log(`${colors.red}✗ Python not found. Error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Attempting to install Python...${colors.reset}`);

    try {
        if (process.platform === 'linux') {
            // Check if we're on Alpine Linux
            const isAlpine = fs.existsSync('/etc/alpine-release');

            if (isAlpine) {
                console.log('Detected Alpine Linux, installing with apk...');
                execSync('apk add --no-cache python3 py3-pip');
            } else {
                // Assume Debian/Ubuntu
                console.log('Detected Debian/Ubuntu-based system, installing with apt...');
                execSync('apt-get update && apt-get install -y python3 python3-pip');
            }
            console.log(`${colors.green}✓ Python installed successfully${colors.reset}`);
        } else {
            console.log(`${colors.red}Automatic Python installation not supported on this platform${colors.reset}`);
        }
    } catch (installError) {
        console.log(`${colors.red}Failed to install Python automatically: ${installError.message}${colors.reset}`);
    }
}

// Check for yt-dlp
try {
    console.log(`\n${colors.blue}Checking for yt-dlp:${colors.reset}`);

    if (fs.existsSync(ytDlpPath)) {
        console.log(`${colors.green}✓ yt-dlp found at: ${ytDlpPath}${colors.reset}`);

        // Check if it's executable
        try {
            fs.accessSync(ytDlpPath, fs.constants.X_OK);
            console.log(`${colors.green}✓ yt-dlp is executable${colors.reset}`);
        } catch (err) {
            console.log(`${colors.red}✗ yt-dlp is not executable${colors.reset}`);
            console.log(`${colors.yellow}Fixing permissions...${colors.reset}`);
            try {
                execSync(`chmod a+rx ${ytDlpPath}`);
                console.log(`${colors.green}✓ Permissions fixed${colors.reset}`);
            } catch (chmodError) {
                console.log(`${colors.red}Failed to fix permissions: ${chmodError.message}${colors.reset}`);
            }
        }

        // Check if yt-dlp works
        try {
            const version = execSync(`${ytDlpPath} --version`).toString().trim();
            console.log(`${colors.green}✓ yt-dlp is working, version: ${version}${colors.reset}`);
        } catch (execError) {
            console.log(`${colors.red}✗ yt-dlp failed to execute: ${execError.message}${colors.reset}`);
        }
    } else {
        console.log(`${colors.red}✗ yt-dlp not found at: ${ytDlpPath}${colors.reset}`);
        console.log(`${colors.yellow}Attempting to download yt-dlp...${colors.reset}`);

        try {
            // Create directory if it doesn't exist
            const dir = path.dirname(ytDlpPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Download yt-dlp
            execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath}`);
            execSync(`chmod a+rx ${ytDlpPath}`);
            console.log(`${colors.green}✓ Downloaded yt-dlp successfully${colors.reset}`);
        } catch (downloadError) {
            console.log(`${colors.red}Failed to download yt-dlp: ${downloadError.message}${colors.reset}`);
        }
    }
} catch (error) {
    console.log(`${colors.red}Error checking yt-dlp: ${error.message}${colors.reset}`);
}

// Check for wrapper script
try {
    console.log(`\n${colors.blue}Checking for yt-dlp wrapper:${colors.reset}`);

    if (fs.existsSync(ytDlpWrapper)) {
        console.log(`${colors.green}✓ yt-dlp wrapper found at: ${ytDlpWrapper}${colors.reset}`);

        // Check if it's executable
        try {
            fs.accessSync(ytDlpWrapper, fs.constants.X_OK);
            console.log(`${colors.green}✓ yt-dlp wrapper is executable${colors.reset}`);
        } catch (err) {
            console.log(`${colors.red}✗ yt-dlp wrapper is not executable${colors.reset}`);
            console.log(`${colors.yellow}Fixing permissions...${colors.reset}`);
            try {
                execSync(`chmod a+rx ${ytDlpWrapper}`);
                console.log(`${colors.green}✓ Permissions fixed${colors.reset}`);
            } catch (chmodError) {
                console.log(`${colors.red}Failed to fix permissions: ${chmodError.message}${colors.reset}`);
            }
        }
    } else {
        console.log(`${colors.red}✗ yt-dlp wrapper not found at: ${ytDlpWrapper}${colors.reset}`);
    }
} catch (error) {
    console.log(`${colors.red}Error checking yt-dlp wrapper: ${error.message}${colors.reset}`);
}

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.brightGreen}Environment check completed${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}`); 