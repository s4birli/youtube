#!/bin/sh

# yt-dlp-wrapper.sh - Debug wrapper for yt-dlp
# This script logs yt-dlp execution, making it easier to troubleshoot issues

LOG_FILE="/app/yt-dlp-debug.log"
SCRIPT_NAME="yt-dlp-wrapper"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$SCRIPT_NAME] $1" >> "$LOG_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$SCRIPT_NAME] $1" >&2
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
ARGS="--no-check-certificate --no-cache-dir --geo-bypass --verbose $*"

# Execute yt-dlp with all arguments
log "Executing: $YT_DLP_PATH $ARGS"

# Run the command and capture both stdout and stderr
OUTPUT_FILE=$(mktemp)
ERROR_FILE=$(mktemp)

set -o pipefail
"$YT_DLP_PATH" $ARGS > "$OUTPUT_FILE" 2> "$ERROR_FILE"
EXIT_CODE=$?

# Check for error and log detailed information
if [ $EXIT_CODE -ne 0 ]; then
  log "Error (exit code: $EXIT_CODE)"
  
  # Log error output
  if [ -s "$ERROR_FILE" ]; then
    log "ERROR OUTPUT START --------------------------"
    cat "$ERROR_FILE" | while read -r line; do
      log "ERROR: $line"
    done
    log "ERROR OUTPUT END ----------------------------"
  else
    log "No error output captured"
  fi
  
  # Try running with --verbose to get more information
  if [ $EXIT_CODE -eq 127 ]; then
    log "Executable not found error (127). Checking system:"
    log "PYTHON: $(which python3 2>&1)"
    log "PYTHON VERSION: $(python3 --version 2>&1)"
    log "OS INFO: $(cat /etc/*release* 2>&1 || echo 'OS info not available')"
  fi
  
  # Output the error to stderr
  cat "$ERROR_FILE" >&2
else
  log "Success (exit code: $EXIT_CODE)"
  
  # Only log the first few lines of output if successful
  if [ -s "$OUTPUT_FILE" ]; then
    OUTPUT_LINES=$(wc -l < "$OUTPUT_FILE")
    log "Command produced $OUTPUT_LINES lines of output"
    
    if [ "$OUTPUT_LINES" -gt 20 ]; then
      head -n 20 "$OUTPUT_FILE" | while read -r line; do
        log "OUTPUT: $line"
      done
      log "OUTPUT: ... (output truncated, total $OUTPUT_LINES lines)"
    else
      cat "$OUTPUT_FILE" | while read -r line; do
        log "OUTPUT: $line"
      done
    fi
  else
    log "Command produced no output"
  fi
fi

# Output the result
cat "$OUTPUT_FILE"

# Clean up temp files
rm -f "$OUTPUT_FILE" "$ERROR_FILE"

exit $EXIT_CODE 