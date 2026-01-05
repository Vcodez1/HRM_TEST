#!/bin/bash

# Exit on error
set -e

echo "Starting custom build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend with Vite
echo "Building frontend..."
# Run vite build. It uses vite.config.ts in the root by default.
npx vite build

# Build backend with esbuild
echo "Building backend..."
# Explicitly set outfile to ensure start script finds it
npx esbuild server/index.ts --platform=node --bundle --format=esm --packages=external --outfile=dist/index.js

echo "Build complete!"
