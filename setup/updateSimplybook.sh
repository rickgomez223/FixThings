#!/bin/bash

# Fetch SimplyBook API Key from Firebase (Assumes you have set up Firebase CLI with your project)
API_KEY=$(curl -s 'https://fixthings-db8b0-default-rtdb.firebaseio.com/apiKeys/SIMPLYBOOK_KEY.json' | jq -r '.')

# Fetch services JSON
SERVICES=$(curl -s 'https://fixthings.pro/src/services.json')

# Iterate over services and send POST requests
echo "$SERVICES" | jq -c '.[]' | while read -r SERVICE; do
    SERVICE_NAME=$(echo "$SERVICE" | jq -r '.name')
    PAYLOAD=$(echo "$SERVICE" | jq -c '{service_name: .name, description: .description, price: .price, duration: .duration, staff_id: .staff_id, service_type: .type, expenses: .expenses}')
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST 'https://user-api-v2.simplybook.me/admin/api/services' \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

    if [ "$RESPONSE" -eq 201 ]; then
        echo "Service created: $SERVICE_NAME"
    else
        echo "Failed to create service: $SERVICE_NAME (HTTP $RESPONSE)"
    fi
done