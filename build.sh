#!/bin/bash

# Exit on error
set -e

echo "Starting custom build process..."

# Get current script directory
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend with Vite
echo "Building frontend..."
# Vite uses absolute paths in vite.config.ts now
npx vite build

# Build backend with esbuild
echo "Building backend..."
# Fixed esbuild command for the server with absolute output path
npx esbuild "$PROJECT_ROOT/server/index.ts" --platform=node --bundle --format=esm --packages=external --outfile="$PROJECT_ROOT/dist/index.js"

echo "Build complete!"
