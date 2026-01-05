#!/bin/bash

# Exit on error
set -e

echo "Starting custom build process..."

# Force include dev dependencies during build phase regardless of NODE_ENV
echo "Installing all dependencies (including devDependencies)..."
npm install --include=dev

# Build frontend with Vite
echo "Building frontend..."
npx vite build

# Build backend with esbuild
echo "Building backend..."
# Explicitly set outfile to ensure start script finds it
PROJECT_ROOT=$(pwd)
npx esbuild server/index.ts --platform=node --bundle --format=esm --packages=external --outfile="$PROJECT_ROOT/dist/index.js"

echo "Build complete!"
