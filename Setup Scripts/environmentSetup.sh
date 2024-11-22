#!/bin/bash

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root."
  exit
fi

echo "Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "Installing essential tools..."
apt install -y build-essential curl git unzip apt-transport-https ca-certificates gnupg

# Install or update Node Version Manager (nvm) and Node.js
if command -v nvm &> /dev/null; then
  echo "Updating Node Version Manager (nvm)..."
  cd "$NVM_DIR" && git pull origin master
else
  echo "Installing Node Version Manager (nvm)..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

echo "Installing the latest Node.js..."
nvm install node
nvm alias default node

# Install or update GitHub CLI
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

# Install or update Google Cloud SDK
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

echo "Environment setup complete!"