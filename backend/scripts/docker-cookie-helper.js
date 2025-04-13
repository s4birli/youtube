#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runDoctor } = require('./cookie-doctor');
const os = require('os');

/**
 * Docker Cookie Helper
 * 
 * Utility to handle cookie files in Docker environments, especially for yt-dlp
 * This script:
 * 1. Checks if a cookie file exists at the source location
 * 2. Validates and fixes the cookie file format if needed
 * 3. Copies the fixed file to the Docker container if specified
 */

// Default paths
const DEFAULT_SOURCE_PATH = path.join(os.homedir(), 'youtube_cookies.txt');
const DEFAULT_CONTAINER_NAME = 'youtube-downloader';
const DEFAULT_CONTAINER_PATH = '/app/youtube_cookies.txt';

/**
 * Check if a Docker container is running
 * @param {string} containerName - Name of the Docker container
 * @returns {boolean} - True if the container is running, false otherwise
 */
function isContainerRunning(containerName) {
    try {
        const result = execSync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`, {
            encoding: 'utf8'
        }).trim();
        return result === containerName;
    } catch (error) {
        return false;
    }
}

/**
 * Copy a file to a Docker container
 * @param {string} sourcePath - Local file path
 * @param {string} containerName - Name of the Docker container
 * @param {string} containerPath - Path inside the container
 * @returns {Object} - Result of the copy operation
 */
function copyToContainer(sourcePath, containerName, containerPath) {
    try {
        if (!isContainerRunning(containerName)) {
            return {
                success: false,
                message: `Container '${containerName}' is not running`
            };
        }

        execSync(`docker cp "${sourcePath}" ${containerName}:${containerPath}`, {
            stdio: 'inherit'
        });

        return {
            success: true,
            message: `Successfully copied ${sourcePath} to ${containerName}:${containerPath}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Error copying file to container: ${error.message}`
        };
    }
}

/**
 * Print usage instructions
 */
function printUsage() {
    console.log(`
🐳 Docker Cookie Helper 🍪
--------------------------
Validates and copies cookie files to Docker containers

Usage:
  node docker-cookie-helper.js [options]

Options:
  --source, -s <path>        Source cookie file path (default: ${DEFAULT_SOURCE_PATH})
  --container, -c <name>     Docker container name (default: ${DEFAULT_CONTAINER_NAME})
                             Use 'none' to skip copying to container
  --target, -t <path>        Target path in container (default: ${DEFAULT_CONTAINER_PATH})
  --help                     Show this help message

Examples:
  node docker-cookie-helper.js
  node docker-cookie-helper.js -s ~/cookies.txt -c my-container
  node docker-cookie-helper.js --source ./cookies.txt --container none
`);
}

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        sourcePath: DEFAULT_SOURCE_PATH,
        containerName: DEFAULT_CONTAINER_NAME,
        containerPath: DEFAULT_CONTAINER_PATH
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help') {
            printUsage();
            process.exit(0);
        } else if (arg === '--source' || arg === '-s') {
            result.sourcePath = args[++i] || DEFAULT_SOURCE_PATH;
            // Handle tilde in paths
            if (result.sourcePath.startsWith('~/')) {
                result.sourcePath = path.join(os.homedir(), result.sourcePath.slice(2));
            }
        } else if (arg === '--container' || arg === '-c') {
            result.containerName = args[++i] || DEFAULT_CONTAINER_NAME;
        } else if (arg === '--target' || arg === '-t') {
            result.containerPath = args[++i] || DEFAULT_CONTAINER_PATH;
        }
    }

    return result;
}

/**
 * Main function
 */
function main() {
    console.log('\n🐳 Docker Cookie Helper 🍪\n');

    // Parse command line arguments
    const args = process.argv.slice(2);

    // Parse arguments
    const sourcePath = args[0] || DEFAULT_SOURCE_PATH;
    const containerName = args[1] || DEFAULT_CONTAINER_NAME;
    const containerPath = args[2] || DEFAULT_CONTAINER_PATH;

    console.log(`
🍪 DOCKER COOKIE HELPER
------------------------
Source cookie file: ${sourcePath}
Docker container: ${containerName}
Target path: ${containerPath}
`);

    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source cookie file not found: ${sourcePath}`);
        console.log(`ℹ️ Create a cookie file at this location or specify a different path`);
        return;
    }

    // Create a temp fixed file
    const tempFixedPath = `${sourcePath}.fixed`;

    // Run the cookie doctor to fix the file
    const doctorResult = runDoctor(sourcePath, tempFixedPath);

    if (!doctorResult.success) {
        console.error('❌ Failed to fix cookie file');
        return;
    }

    // Use the correct file path - either the fixed one or the original if already valid
    const finalSourcePath = doctorResult.message === 'File already valid'
        ? sourcePath
        : doctorResult.fix.outputPath;

    // Copy the file to the container if specified
    if (containerName !== 'none') {
        const copied = copyToContainer(finalSourcePath, containerName, containerPath);

        if (copied) {
            console.log(`\n✅ Cookie file is now ready for use in the container!`);

            // Provide a command to test with yt-dlp
            console.log(`
📝 To test your cookies with yt-dlp, run:
docker exec ${containerName} yt-dlp --cookies "${containerPath}" -F "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
`);
        }
    } else {
        console.log(`\n✅ Cookie file fixed and ready at: ${finalSourcePath}`);
    }

    // Clean up the temp file if it's different from the output
    if (tempFixedPath !== finalSourcePath && fs.existsSync(tempFixedPath)) {
        fs.unlinkSync(tempFixedPath);
    }
}

// Run the script if executed directly
if (require.main === module) {
    main();
} 