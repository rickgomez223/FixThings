#!/bin/bash

# Ensure script is run from project root
if [ ! -f package.json ]; then
  echo "Error: Not a Node.js project folder (no package.json found)."
  exit
fi

echo "Updating project dependencies and tools..."

# Update npm to latest version
echo "Updating npm..."
npm install -g npm

# Update npm-check-updates for dependency management
echo "Installing npm-check-updates globally..."
npm install -g npm-check-updates

# Check for project dependencies updates
echo "Updating project dependencies to latest versions..."
ncu -u && npm install

# Update Firebase Tools
if npm list -g firebase-tools &> /dev/null; then
  echo "Updating Firebase Tools..."
  npm install -g firebase-tools
fi

# Update ESLint
if npm list eslint &> /dev/null; then
  echo "Updating ESLint..."
  npm install eslint@latest
fi

# Install Emmet for enhanced HTML/CSS workflow (for VSCode or similar)
echo "Emmet requires specific setup in your code editor; no npm package available."

echo "Project dependencies and tools updated successfully!"