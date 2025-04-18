#!/bin/sh

# yt-dlp-wrapper.sh - Debug wrapper for yt-dlp
# This script logs yt-dlp execution, making it easier to troubleshoot issues

LOG_FILE="/app/yt-dlp-debug.log"
SCRIPT_NAME="yt-dlp-wrapper"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$SCRIPT_NAME] $1" >> "$LOG_FILE"
}

# Make sure the log directory exists
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null

# Log the command and arguments
log "Command: yt-dlp $*"
log "Working directory: $(pwd)"
log "User: $(whoami)"
log "PATH: $PATH"

# Check if yt-dlp exists and is executable
YT_DLP_PATH="${YT_DLP_PATH:-/usr/local/bin/yt-dlp}"
if [ ! -x "$YT_DLP_PATH" ]; then
  log "ERROR: yt-dlp not found at $YT_DLP_PATH or not executable"
  echo "ERROR: yt-dlp not found at $YT_DLP_PATH or not executable" >&2
  exit 1
fi

# Log version information
VERSION=$("$YT_DLP_PATH" --version 2>&1)
log "yt-dlp version: $VERSION"

# Add additional arguments to bypass common issues
ARGS="--no-check-certificate --no-cache-dir --geo-bypass $*"

# Execute yt-dlp with all arguments
log "Executing: $YT_DLP_PATH $ARGS"
OUTPUT=$("$YT_DLP_PATH" $ARGS 2>&1)
EXIT_CODE=$?

# Log the result
if [ $EXIT_CODE -eq 0 ]; then
  log "Success (exit code: $EXIT_CODE)"
  # Only log the first few lines of output if successful to avoid huge logs
  echo "$OUTPUT" | head -n 20 | while read -r line; do
    log "OUTPUT: $line"
  done
  if [ $(echo "$OUTPUT" | wc -l) -gt 20 ]; then
    log "OUTPUT: ... (output truncated, see full command output below)"
  fi
else
  log "Error (exit code: $EXIT_CODE)"
  echo "$OUTPUT" | while read -r line; do
    log "ERROR OUTPUT: $line"
  done
fi

# Pass the output back to the calling program
echo "$OUTPUT"
exit $EXIT_CODE 