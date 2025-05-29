#!/bin/bash

# Build script for Railway deployment
set -e

echo "Building client..."
# Build the frontend
vite build --config vite.config.ts

echo "Building server..."
# Build the backend
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"