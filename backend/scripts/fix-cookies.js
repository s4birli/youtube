#!/usr/bin/env node
/**
 * Fix-Cookies.js - Repairs malformed Netscape cookie files
 * 
 * Usage: node fix-cookies.js input.txt [output.txt] [--force] [--help]
 */

const fs = require('fs');
const path = require('path');
const { fixCookieFile } = require('./cookie-doctor');

// Process command line arguments
const args = process.argv.slice(2);
let inputFile = null;
let outputFile = null;
let force = false;

// Check for help flag
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log('Usage: node fix-cookies.js input.txt [output.txt] [--force]');
    console.log('');
    console.log('Options:');
    console.log('  input.txt       Input cookie file in Netscape format');
    console.log('  output.txt      Output file (defaults to input-fixed.txt if not specified)');
    console.log('  --force, -f     Overwrite output file if it exists');
    console.log('  --help, -h      Show this help message');
    process.exit(0);
}

// Check for force flag
if (args.includes('--force') || args.includes('-f')) {
    force = true;
    args.splice(args.indexOf(args.find(arg => arg === '--force' || arg === '-f')), 1);
}

// Get input and output file paths
inputFile = args[0];
outputFile = args[1] || `${path.basename(inputFile, path.extname(inputFile))}-fixed${path.extname(inputFile)}`;

// Validate input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
}

// Check if output file already exists
if (fs.existsSync(outputFile) && !force) {
    console.error(`Error: Output file already exists: ${outputFile}`);
    console.error('Use --force to overwrite');
    process.exit(1);
}

// Main function to fix cookies
async function main() {
    try {
        console.log(`Fixing cookie file: ${inputFile}`);
        console.log(`Output will be saved to: ${outputFile}`);

        const result = await fixCookieFile(inputFile, outputFile);

        console.log('\nFix complete!\n');
        console.log(`Total issues fixed: ${result.totalFixes}`);
        console.log(`Valid cookies found: ${result.validCookieCount}`);

        if (result.skippedCookieCount > 0) {
            console.log(`Skipped malformed cookies: ${result.skippedCookieCount}`);
        }

        if (result.ytCookieCount > 0) {
            console.log(`YouTube/Google cookies found: ${result.ytCookieCount}`);
        }

        console.log(`\nCookie file saved to: ${outputFile}`);
        return true;
    } catch (error) {
        console.error(`Error fixing cookie file: ${error.message}`);
        return false;
    }
}

// Run the script
main()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => console.error(err) && process.exit(1)); 