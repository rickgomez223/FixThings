#!/bin/bash

# Function to read input and base64 encode it
read_and_encode() {
    local var_name="$1"
    read -p "Enter ${var_name}: " input
    # Base64 encode the input and return it
    echo -n "$input" | base64
}

# Prompt for inputs
PRIVATE_KEY_ENCODED=$(read_and_encode "YOUR_PRIVATE_KEY")
POSTMARK_SERVER_KEY_ENCODED=$(read_and_encode "YOUR_POSTMARK_SERVER_KEY")
PUSHCUT_WEBHOOK_URL_ENCODED=$(read_and_encode "YOUR_PUSHCUT_WEBHOOK_URL")

# Deploy the function with encoded environment variables
gcloud functions deploy formSubmitHandler \
  --set-env-vars PRIVATE_KEY="$PRIVATE_KEY_ENCODED" \
  --set-env-vars POSTMARK_SERVER_KEY="$POSTMARK_SERVER_KEY_ENCODED" \
  --set-env-vars PUSHCUT_WEBHOOK_URL="$PUSHCUT_WEBHOOK_URL_ENCODED" \
  --runtime nodejs16 \
  --trigger-http \
  --allow-unauthenticated

echo "Deployment complete."