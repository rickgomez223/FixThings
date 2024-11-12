#!/bin/bash

# Get SimplyBook.me session token
LOGIN_PAYLOAD='{"company_login":"fixthings","user_login":"rickgomez223@gmail.com","password":"Jergens1972."}'
TOKEN_RESPONSE=$(curl -s -X POST 'https://user-api-v2.simplybook.me/admin/auth' -H 'Content-Type: application/json' -d "$LOGIN_PAYLOAD")
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')

# Validate token
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Failed to retrieve session token."
    exit 1
fi

# Fetch services JSON
SERVICES=$(curl -s 'https://fixthings.pro/src/services.json')

# Iterate over services and send POST requests
echo "$SERVICES" | jq -c '.[]' | while read -r SERVICE; do
    SERVICE_NAME=$(echo "$SERVICE" | jq -r '.name')
    PAYLOAD=$(echo "$SERVICE" | jq -c '{name: .name, description: .description, price: .price, duration: .duration, staff: .staff_id, service_category: .type, expenses: .expenses}')
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST 'https://user-api-v2.simplybook.me/admin/api/services' \
        -H "X-Company-Login: <your_company_login>" \
        -H "X-Token: $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

    if [ "$RESPONSE" -eq 201 ]; then
        echo "Service created: $SERVICE_NAME"
    else
        echo "Failed to create service: $SERVICE_NAME (HTTP $RESPONSE)"
    fi
done