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

# Update Postmark CLI (if applicable)
if command -v postmark-cli &> /dev/null; then
  echo "Postmark CLI installed. Update manually if needed."
else
  echo "Postmark CLI not found. Install manually if needed."
fi

echo "System packages and developer tools updated successfully!"