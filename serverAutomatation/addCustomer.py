import smtplib
from email.mime.text import MIMEText
import requests
import json

# Firebase URLs
FIREBASE_DB_URL = "https://fixthings-db8b0-default-rtdb.firebaseio.com/customers"
FIREBASE_KEY_URL = "https://fixthings-db8b0-default-rtdb.firebaseio.com/apiKeys/POSTMARK_SERVER_KEY.json"  # URL for Postmark key in Firebase

POSTMARK_API_URL = "https://api.postmarkapp.com/email/withTemplate"
POSTMARK_TEMPLATE_ID = "CustomerSignupEmail"  # Replace with your actual Postmark template ID

def get_postmark_key():
    """Fetches the Postmark API key from Firebase."""
    try:
        response = requests.get(FIREBASE_KEY_URL)
        response.raise_for_status()
        key_data = response.json()
        return key_data if key_data else None
    except requests.exceptions.RequestException as e:
        print(f"Failed to retrieve Postmark key: {e}")
        return None

def send_followup_email(data):
    postmark_key = get_postmark_key()  # Retrieve the Postmark key from Firebase
    if not postmark_key:
        print("Postmark key not found.")
        return

    email_data = {
        "From": "kyle@fixthings.pro",  # Your Postmark verified email address
        "To": data["email"],
        "TemplateAlias": POSTMARK_TEMPLATE_ID,
        "TemplateModel": {
            "name": data["name"],
            "phone": data.get("phone"),
            "carYear": data.get("carYear"),
            "carMake": data.get("carMake"),
            "carModel": data.get("carModel"),
            "carTrim": data.get("carTrim"),
            "comments": data.get("comments")
        },
    }

    headers = {
        "Accept": "application/json",
        "X-Postmark-Server-Token": postmark_key,
    }

    try:
        response = requests.post(POSTMARK_API_URL, json=email_data, headers=headers)
        response.raise_for_status()
        print("Follow-up email sent successfully via Postmark.")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send email via Postmark: {e}")

def post_to_firebase(data):
    """Stores customer data in Firebase using the customer's name as the key."""
    # Format the customer name to use as a Firebase key (replace spaces with underscores)
    customer_key = data["name"].replace(" ", "_")
    url = f"{FIREBASE_DB_URL}/{customer_key}.json"

    try:
        # Use PUT to create/update an entry with the specified customer key
        response = requests.put(url, json=data)
        response.raise_for_status()
        print(f"Data for {data['name']} stored in Firebase:", response.json())
    except requests.exceptions.RequestException as e:
        print(f"Failed to store data for {data['name']} in Firebase: {e}")

def main(data):
    post_to_firebase(data)  # Store customer data in Firebase under the customer's name
    send_followup_email(data)  # Send follow-up email via Postmark



main(data)
