#!/bin/bash

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root."
  exit
fi

echo "Updating system packages..."
# Update package list and upgrade all packages
apt update && apt upgrade -y

# Install essential development tools
echo "Installing essential development tools..."
apt install -y build-essential curl git unzip

# Install Node Version Manager (nvm) and Node.js
if command -v nvm &> /dev/null; then
  echo "Updating Node Version Manager (nvm)..."
  cd "$NVM_DIR" && git pull origin master
else
  echo "Installing Node Version Manager (nvm)..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  # Load nvm for the current session
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

# Install the latest Node.js version
echo "Installing the latest version of Node.js..."
nvm install node
nvm alias default node

# Update GitHub CLI
if command -v gh &> /dev/null; then
  echo "Updating GitHub CLI..."
  gh upgrade
else
  echo "Installing GitHub CLI..."
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt update && apt install gh -y
fi

# Update Firebase CLI
if command -v firebase &> /dev/null; then
  echo "Updating Firebase CLI..."
  npm install -g firebase-tools
else
  echo "Installing Firebase CLI..."
  curl -sL https://firebase.tools | bash
fi

# Update Google Cloud SDK
if command -v gcloud &> /dev/null; then
  echo "Updating Google Cloud SDK..."
  gcloud components update
else
  echo "Installing Google Cloud SDK..."
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
  apt install -y apt-transport-https ca-certificates gnupg
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
  apt update && apt install -y google-cloud-sdk
fi

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

# Update ESLint if it's listed in package.json
if npm list eslint &> /dev/null; then
  echo "Updating ESLint..."
  npm install eslint@latest
fi

# Install Emmet for enhanced HTML/CSS workflow (for VSCode or similar)
echo "Emmet requires specific setup in your code editor; no npm package available."

echo "Project dependencies and tools updated successfully!"
echo "System packages and developer tools updated successfully!"