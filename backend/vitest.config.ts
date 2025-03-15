/* eslint-disable */
// @ts-nocheck
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    dangerouslyIgnoreUnhandledErrors: true,
    // Hide 'Failed to create download directory' errors in test output
    onConsoleLog(log) {
      if (log && log.includes && log.includes('Failed to create download directory')) {
        return false;
      }
      return undefined;
    },
    // Silence the unhandled errors section in the report
    reporters: ['default'],
    outputFile: {
      json: './test-results.json',
    },
  },
});
