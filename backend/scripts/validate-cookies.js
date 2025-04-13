#!/usr/bin/env node
/**
 * Cookie file validator
 * 
 * Validates a Netscape format cookie file for use with YouTube downloaders
 * Usage: node validate-cookies.js path/to/cookies.txt [--verbose] [--help]
 */

const fs = require('fs');
const path = require('path');
const { validateCookieFile } = require('./cookie-doctor');

// Process command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const verbose = args.includes('--verbose') || args.includes('-v');

// Remove flags from arguments
const cookieFilePath = args.filter(arg => !arg.startsWith('-'))[0];

// Show help if requested or no cookie file specified
if (showHelp || !cookieFilePath) {
    console.log(`
Cookie File Validator

Validates a Netscape format cookie file for use with YouTube downloaders.

Usage: node validate-cookies.js path/to/cookies.txt [options]

Options:
  --verbose, -v  Show detailed error information
  --help, -h     Show this help message
`);
    process.exit(showHelp ? 0 : 1);
}

// Check if the cookie file exists
if (!fs.existsSync(cookieFilePath)) {
    console.error(`Error: Cookie file not found: ${cookieFilePath}`);
    process.exit(1);
}

// Main validation function
async function main() {
    try {
        const result = await validateCookieFile(cookieFilePath);

        if (result.valid) {
            console.log(`✅ Cookie file is valid!`);
            console.log(`Found ${result.validCookieCount} valid cookies`);
            console.log(`Found ${result.ytCookieCount} YouTube cookies`);
            process.exit(0);
        } else {
            console.error(`❌ Cookie file is invalid!`);
            console.log(`Found ${result.validCookieCount} valid cookies`);
            console.log(`Found ${result.invalidCookieCount} invalid cookies`);
            console.log(`Found ${result.ytCookieCount} YouTube cookies`);

            if (verbose && result.errors.length > 0) {
                console.log(`\nErrors found:`);
                result.errors.forEach((error, index) => {
                    console.log(`${index + 1}. ${error.message}`);
                    if (error.line) {
                        console.log(`   Line ${error.line}: ${error.content}`);
                    }
                });
            } else {
                console.log(`\nRun with --verbose for detailed error information`);
            }

            process.exit(1);
        }
    } catch (error) {
        console.error(`Error validating cookie file: ${error.message}`);
        process.exit(1);
    }
}

main(); 