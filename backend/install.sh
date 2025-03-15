#!/bin/bash

echo "Installing YouTube Downloader Backend Dependencies"
echo "=================================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js and try again."
    exit 1
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data/downloads

# Option 1: Install with Husky (Git hooks)
install_with_husky() {
    echo "Installing dependencies with Husky Git hooks..."
    npm install
}

# Option 2: Install without Husky
install_without_husky() {
    echo "Installing dependencies without Husky Git hooks..."
    npm install --ignore-scripts
}

# Option 3: Install only production dependencies
install_production() {
    echo "Installing production dependencies only..."
    npm install --omit=dev --ignore-scripts
}

# Show installation options
echo
echo "Installation Options:"
echo "1) Complete installation with Git hooks (recommended for development)"
echo "2) Installation without Git hooks (if you're having Git related errors)"
echo "3) Production dependencies only (minimal installation)"
echo

# Get user input
read -p "Select installation option (1-3): " option

case $option in
    1)
        install_with_husky
        ;;
    2)
        install_without_husky
        ;;
    3)
        install_production
        ;;
    *)
        echo "Invalid option. Installing without Husky as a safe default."
        install_without_husky
        ;;
esac

echo
echo "Setup completed!"
echo "You can now run the development server with: npm run dev" 