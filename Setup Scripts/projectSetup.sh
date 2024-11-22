#!/bin/bash

# Ensure script is run in a Node.js project folder
if [ ! -f package.json ]; then
  echo "Error: Not a Node.js project folder (no package.json found)."
  exit
fi

echo "Updating project dependencies and tools..."

# Update npm to the latest version
echo "Updating npm globally..."
npm install -g npm

# Install project-specific global tools
echo "Installing Firebase CLI..."
npm install -g firebase-tools

echo "Installing Firebase Admin..."
npm install firebase-admin --save

echo "Installing Postmark..."
npm install postmark --save

echo "Installing CORS..."
npm install cors --save

# Update project dependencies
echo "Updating project dependencies to the latest versions..."
npm install

# Install npm-check-updates for dependency management
echo "Installing npm-check-updates globally..."
npm install -g npm-check-updates

echo "Updating dependencies listed in package.json..."
ncu -u && npm install

# Update ESLint if it exists in project dependencies
if npm list eslint &> /dev/null; then
  echo "Updating ESLint..."
  npm install eslint@latest
fi

echo "Project setup complete!"