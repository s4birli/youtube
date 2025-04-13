#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Cookie Doctor - A utility to validate and fix Netscape format cookie files
 * 
 * Especially useful for fixing YouTube cookie files used with yt-dlp which can be 
 * particularly finicky about cookie file formats
 */

// Constants
const EXPECTED_HEADER = '# Netscape HTTP Cookie File';
const EXPECTED_FIELDS = 7; // domain, flag, path, secure, expiration, name, value
const FIELD_SEPARATOR = '\t';
const LINE_ENDING = '\n';

/**
 * Validates a cookie file
 * @param {string} filePath - Path to the cookie file
 * @returns {Object} - Result of validation
 */
async function validateCookieFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                valid: false,
                issues: [`File does not exist: ${filePath}`],
                linesWithIssues: []
            };
        }

        const content = await fs.promises.readFile(filePath, 'utf8');
        const lines = content.split(/\r?\n/);
        const issues = [];
        const linesWithIssues = [];

        // Check if file starts with the Netscape header
        if (!lines[0] || !lines[0].startsWith(EXPECTED_HEADER)) {
            issues.push('Missing or invalid Netscape header');
            linesWithIssues.push(0);
        }

        // Process each line (skipping header and empty lines)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comment lines
            if (line === '' || line.startsWith('#')) {
                continue;
            }

            // Check each cookie entry
            const fields = line.split(FIELD_SEPARATOR);

            if (fields.length !== EXPECTED_FIELDS) {
                issues.push(`Line ${i + 1}: Expected ${EXPECTED_FIELDS} fields, found ${fields.length}`);
                linesWithIssues.push(i);
                continue;
            }

            const [domain, flag, path, secure, expiration, name, value] = fields;

            // Domain validation
            if (!domain || domain.trim() === '') {
                issues.push(`Line ${i + 1}: Missing domain`);
                linesWithIssues.push(i);
            }

            // Flag validation (should be TRUE or FALSE)
            if (flag !== 'TRUE' && flag !== 'FALSE') {
                issues.push(`Line ${i + 1}: Invalid flag "${flag}", should be TRUE or FALSE`);
                linesWithIssues.push(i);
            }

            // Path validation
            if (!path || path.trim() === '') {
                issues.push(`Line ${i + 1}: Missing path`);
                linesWithIssues.push(i);
            }

            // Secure validation (should be TRUE or FALSE)
            if (secure !== 'TRUE' && secure !== 'FALSE') {
                issues.push(`Line ${i + 1}: Invalid secure flag "${secure}", should be TRUE or FALSE`);
                linesWithIssues.push(i);
            }

            // Expiration validation (should be a number)
            if (isNaN(Number(expiration))) {
                issues.push(`Line ${i + 1}: Invalid expiration "${expiration}", should be a number`);
                linesWithIssues.push(i);
            }

            // Name validation
            if (!name || name.trim() === '') {
                issues.push(`Line ${i + 1}: Missing cookie name`);
                linesWithIssues.push(i);
            }

            // Value validation
            if (value === undefined) {
                issues.push(`Line ${i + 1}: Missing cookie value`);
                linesWithIssues.push(i);
            }
        }

        return {
            valid: issues.length === 0,
            issues,
            linesWithIssues
        };
    } catch (error) {
        return {
            valid: false,
            issues: [`Error validating file: ${error.message}`],
            linesWithIssues: []
        };
    }
}

/**
 * Fixes common issues in a cookie file
 * @param {string} inputPath - Path to the cookie file to fix
 * @param {string} outputPath - Path to save the fixed cookie file
 * @returns {Object} - Result of the fix operation
 */
async function fixCookieFile(inputPath, outputPath) {
    try {
        if (!fs.existsSync(inputPath)) {
            return {
                success: false,
                message: `File does not exist: ${inputPath}`,
                fixed: 0,
                removed: 0
            };
        }

        const content = await fs.promises.readFile(inputPath, 'utf8');
        const lines = content.split(/\r?\n/);
        const fixedLines = [];
        let fixedCount = 0;
        let removedCount = 0;

        // Ensure the file has the Netscape header
        if (!lines[0] || !lines[0].startsWith(EXPECTED_HEADER)) {
            fixedLines.push(EXPECTED_HEADER);
            fixedCount++;
        } else {
            fixedLines.push(lines[0]);
        }

        // Process each line (skipping header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // Keep comment lines and empty lines as is
            if (line === '' || line.startsWith('#')) {
                fixedLines.push(line);
                continue;
            }

            // Process cookie entry
            const fields = line.split(FIELD_SEPARATOR);

            // Skip severely malformed entries
            if (fields.length < 4) {
                removedCount++;
                continue;
            }

            // Try to fix entries with missing or extra fields
            let domain, flag, path, secure, expiration, name, value;

            if (fields.length === EXPECTED_FIELDS) {
                [domain, flag, path, secure, expiration, name, value] = fields;
            } else if (fields.length > EXPECTED_FIELDS) {
                // Too many fields, combine extras into the value
                [domain, flag, path, secure, expiration, name, ...value] = fields;
                value = value.join(FIELD_SEPARATOR);
                fixedCount++;
            } else {
                // Not enough fields, fill in missing values
                domain = fields[0] || '';
                flag = fields[1] || 'TRUE';
                path = fields[2] || '/';
                secure = fields[3] || 'FALSE';
                expiration = fields[4] || '0';
                name = fields[5] || '';
                value = fields[6] || '';
                fixedCount++;
            }

            // Fix common field issues
            if (!domain || domain.trim() === '') continue; // Skip entries with no domain

            flag = (flag === 'TRUE' || flag === 'FALSE') ? flag : 'TRUE';
            path = path.trim() || '/';
            secure = (secure === 'TRUE' || secure === 'FALSE') ? secure : 'FALSE';
            expiration = isNaN(Number(expiration)) ? '0' : expiration;

            if (!name || name.trim() === '') continue; // Skip entries with no name
            if (value === undefined) value = '';

            // Rebuild the fixed line
            const fixedLine = [domain, flag, path, secure, expiration, name, value].join(FIELD_SEPARATOR);
            fixedLines.push(fixedLine);
            fixedCount++;
        }

        // Write the fixed content to the output file
        const fixedContent = fixedLines.join(LINE_ENDING);
        await fs.promises.writeFile(outputPath, fixedContent);

        return {
            success: true,
            message: 'File fixed successfully',
            fixed: fixedCount,
            removed: removedCount,
            outputPath
        };
    } catch (error) {
        return {
            success: false,
            message: `Error fixing file: ${error.message}`,
            fixed: 0,
            removed: 0
        };
    }
}

/**
 * Run the doctor: validate, fix if needed, and validate again
 * @param {string} inputPath - Path to the cookie file
 * @param {string} outputPath - Path to save the fixed cookie file
 * @returns {Object} - Result of the doctor operation
 */
function runDoctor(inputPath, outputPath = '') {
    console.log(`\n🔍 Examining cookie file: ${inputPath}`);

    const validateResult = validateCookieFile(inputPath);

    if (validateResult.valid) {
        console.log('✅ Cookie file is valid!');
        return {
            success: true,
            message: 'File already valid',
            validate: validateResult
        };
    }

    console.log(`❌ Found ${validateResult.issues.length} issues in the cookie file`);
    validateResult.issues.forEach(issue => console.log(`   - ${issue}`));

    // Default output path to inputPath.fixed if not provided
    const finalOutputPath = outputPath || `${inputPath}.fixed`;

    console.log(`\n🔧 Attempting to fix the cookie file...`);
    const fixResult = fixCookieFile(inputPath, finalOutputPath);

    if (!fixResult.success) {
        console.error(`❌ Failed to fix the cookie file: ${fixResult.message}`);
        return {
            success: false,
            message: fixResult.message,
            validate: validateResult,
            fix: fixResult
        };
    }

    console.log(`✅ Fixed ${fixResult.fixed} entries, removed ${fixResult.removed} invalid entries`);
    console.log(`📄 Saved fixed file to: ${finalOutputPath}`);

    // Validate the fixed file
    console.log(`\n🔍 Validating the fixed cookie file...`);
    const validateFixedResult = validateCookieFile(finalOutputPath);

    if (validateFixedResult.valid) {
        console.log('✅ Fixed cookie file is valid!');
        return {
            success: true,
            message: 'File fixed and validated',
            validate: validateResult,
            fix: fixResult,
            validateFixed: validateFixedResult
        };
    } else {
        console.log(`❌ Fixed file still has ${validateFixedResult.issues.length} issues:`);
        validateFixedResult.issues.forEach(issue => console.log(`   - ${issue}`));
        return {
            success: false,
            message: 'Failed to fully fix the cookie file',
            validate: validateResult,
            fix: fixResult,
            validateFixed: validateFixedResult
        };
    }
}

/**
 * Print usage instructions
 */
function printUsage() {
    console.log(`
🍪 COOKIE DOCTOR 🍪
------------------
A utility to validate and fix Netscape format cookie files
Especially useful for fixing YouTube cookie files used with yt-dlp

Usage:
  node cookie-doctor.js <command> <file> [output]

Commands:
  validate <file>        - Validate the cookie file format
  fix <file> [output]    - Fix common issues in the cookie file
  doctor <file> [output] - Validate, fix if needed, and validate again

Examples:
  node cookie-doctor.js validate youtube_cookies.txt
  node cookie-doctor.js fix youtube_cookies.txt fixed_cookies.txt
  node cookie-doctor.js doctor youtube_cookies.txt
`);
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        printUsage();
        return;
    }

    const command = args[0];
    const inputPath = args[1];
    const outputPath = args[2] || '';

    switch (command) {
        case 'validate':
            const validateResult = validateCookieFile(inputPath);

            if (validateResult.valid) {
                console.log('✅ Cookie file is valid!');
            } else {
                console.log(`❌ Found ${validateResult.issues.length} issues in the cookie file:`);
                validateResult.issues.forEach(issue => console.log(`   - ${issue}`));
            }
            break;

        case 'fix':
            const fixResult = fixCookieFile(inputPath, outputPath || `${inputPath}.fixed`);

            if (fixResult.success) {
                console.log(`✅ Fixed ${fixResult.fixed} entries, removed ${fixResult.removed} invalid entries`);
                console.log(`📄 Saved fixed file to: ${fixResult.outputPath}`);
            } else {
                console.error(`❌ Failed to fix the cookie file: ${fixResult.message}`);
            }
            break;

        case 'doctor':
            runDoctor(inputPath, outputPath);
            break;

        default:
            console.log(`❌ Unknown command: ${command}`);
            printUsage();
    }
}

// Run the script if executed directly
if (require.main === module) {
    main();
}

// Export functions for use in other scripts
module.exports = {
    validateCookieFile,
    fixCookieFile,
    runDoctor
}; 