#!/bin/bash

echo "Starting custom build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend with Vite
echo "Building frontend..."
npx vite build --config ./vite.config.ts

# Build backend with esbuild
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete!"
