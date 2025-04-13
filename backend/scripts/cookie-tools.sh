#!/bin/bash

# =====================================
# 🍪 YouTube Cookie Tools
# =====================================
#
# A collection of tools for managing, validating, and using
# Netscape format cookie files with YouTube downloaders
#
# Usage: ./cookie-tools.sh [command] [options]

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print the banner
print_banner() {
    echo -e "${YELLOW}"
    echo "🍪 ============================== 🍪"
    echo "      YouTube Cookie Tools"
    echo "🍪 ============================== 🍪"
    echo -e "${NC}"
}

# Print usage information
print_usage() {
    print_banner
    echo -e "A collection of tools for managing YouTube cookie files\n"
    echo -e "Usage: ${BLUE}./cookie-tools.sh${NC} ${GREEN}[command]${NC} [options]\n"
    echo -e "Commands:"
    echo -e "  ${GREEN}doctor${NC}    Validate and fix cookie files"
    echo -e "  ${GREEN}docker${NC}    Copy cookie files to Docker containers"
    echo -e "  ${GREEN}convert${NC}   Convert between different cookie formats"
    echo -e "  ${GREEN}validate${NC}  Validate cookie files without modifying them"
    echo -e "  ${GREEN}help${NC}      Show this help message\n"
    echo -e "Examples:"
    echo -e "  ${BLUE}./cookie-tools.sh${NC} ${GREEN}doctor${NC} ~/youtube_cookies.txt"
    echo -e "  ${BLUE}./cookie-tools.sh${NC} ${GREEN}docker${NC} -s ~/youtube_cookies.txt -c my-container"
    echo -e "  ${BLUE}./cookie-tools.sh${NC} ${GREEN}convert${NC} -i browser.json -o youtube_cookies.txt\n"
    echo -e "For more details on a specific command, run:"
    echo -e "  ${BLUE}./cookie-tools.sh${NC} ${GREEN}help${NC} [command]"
}

# Run the cookie doctor
run_doctor() {
    node "$SCRIPT_DIR/cookie-doctor.js" "$@"
}

# Run the Docker helper
run_docker() {
    node "$SCRIPT_DIR/docker-cookie-helper.js" "$@"
}

# Run the cookie converter
run_convert() {
    node "$SCRIPT_DIR/convert-cookies.js" "$@"
}

# Run the cookie validator
run_validate() {
    node "$SCRIPT_DIR/validate-cookies.js" "$@"
}

# Show help for a specific command
show_command_help() {
    case "$1" in
        doctor)
            node "$SCRIPT_DIR/cookie-doctor.js" --help
            ;;
        docker)
            node "$SCRIPT_DIR/docker-cookie-helper.js" --help
            ;;
        convert)
            node "$SCRIPT_DIR/convert-cookies.js" --help
            ;;
        validate)
            node "$SCRIPT_DIR/validate-cookies.js" --help
            ;;
        *)
            print_usage
            ;;
    esac
}

# Main command router
if [ $# -eq 0 ]; then
    print_usage
    exit 0
fi

command="$1"
shift

case "$command" in
    doctor)
        run_doctor "$@"
        ;;
    docker)
        run_docker "$@"
        ;;
    convert)
        run_convert "$@"
        ;;
    validate)
        run_validate "$@"
        ;;
    help)
        if [ $# -eq 0 ]; then
            print_usage
        else
            show_command_help "$1"
        fi
        ;;
    *)
        echo -e "${RED}Unknown command:${NC} $command"
        print_usage
        exit 1
        ;;
esac 