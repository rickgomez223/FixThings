// Import necessary modules
const express = require("express");           // For creating the server and handling HTTP requests
const crypto = require("crypto");             // For decrypting data using RSA private key
const firebase = require("firebase-admin");   // Firebase Admin SDK for accessing the Firebase Realtime Database
const postmark = require("postmark");         // For sending transactional emails via Postmark
const bodyParser = require("body-parser");    // For parsing incoming request body
const fs = require("fs");                     // For reading files, specifically the private key
const functions = require('firebase-functions'); // Firebase functions config

// === Configuration Variables ===
const PRIVATE_KEY_PATH = functions.config().myapp.private_key;  // Path to your RSA private key for decrypting form data
const FIREBASE_DB_URL = functions.config().myapp.firebase_db_url;  // URL to your Firebase Realtime Database

// Postmark configuration
const POSTMARK_SERVER_KEY = functions.config().myapp.postmark_server_key; // Postmark server key for sending emails
const POSTMARK_FROM_EMAIL = "kyle@fixthings.pro";    // Sender email for Postmark
const POSTMARK_TEMPLATE_ALIAS = "CustomerSignupEmail"; // Email template alias on Postmark

// Pushcut Webhook URL
const PUSHCUT_WEBHOOK_URL = functions.config().myapp.pushcut_webhook_url; // URL for Pushcut webhook notifications

// ================================

// Initialize Express app
const app = express();
app.use(bodyParser.json());  // Automatically parse JSON request bodies

// Firebase setup
firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
    databaseURL: FIREBASE_DB_URL
});
const db = firebase.database();  // Firebase database instance

// Load private key for decryption
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");  // Reading the RSA private key file

// Postmark setup
const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY); // Initialize Postmark client

// Route for form submission
app.post("/submit", async (req, res) => {
    try {
        console.log("Received form submission request"); // Log start of submission process

        // Step 1: Decrypt the incoming data
        const encryptedData = req.body.data;
        console.log("Decrypting incoming data"); // Log decryption step
        const decryptedData = decryptWithPrivateKey(encryptedData);
        const formData = JSON.parse(decryptedData);
        console.log("Decryption successful, parsed form data:", formData); // Log decrypted data for tracing

        // Step 2: Increment ticket number and store data
        console.log("Incrementing ticket number in Firebase"); // Log ticket number increment step
        const ticketNumber = await incrementTicketNumber();
        formData.ticketNumber = ticketNumber; // Assign ticket number to the form data
        await db.ref(`customers/${ticketNumber}`).set(formData); // Store form data in Firebase with the ticket number as a key
        console.log(`Stored customer data with ticket number: ${ticketNumber}`); // Confirm data storage

        // Step 3: Send confirmation email via Postmark
        console.log("Sending confirmation email via Postmark"); // Log email sending step
        await sendPostmarkEmail(formData);
        console.log("Email sent successfully to:", formData.email); // Confirm email was sent

        // Step 4: Send webhook notification
        console.log("Sending webhook notification to Pushcut"); // Log webhook step
        await sendWebhook(formData);
        console.log("Webhook notification sent successfully"); // Confirm webhook was sent

        // Step 5: Respond to client
        res.json({ ticketNumber }); // Send ticket number as confirmation to the client
        console.log(`Response sent to client with ticket number: ${ticketNumber}`); // Log response completion

    } catch (error) {
        console.error("Form submission failed:", error); // Log the error if something went wrong
        res.status(500).json({ message: "Form submission failed" }); // Send failure response to client
    }
});

// Decrypt function using RSA private key
function decryptWithPrivateKey(encryptedData) {
    return crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(encryptedData, "base64")
    ).toString("utf8");
}

// Firebase helper to increment ticket number
async function incrementTicketNumber() {
    const customerCountRef = db.ref("meta/customerCount"); // Reference to ticket count in Firebase
    const snapshot = await customerCountRef.once("value"); // Fetch current ticket count

    let newCount;
    if (!snapshot.exists()) {  // Initialize count if it doesn't exist
        newCount = 1;
        await customerCountRef.set({ count: newCount });
        console.log("Initialized ticket counter at 1"); // Log new counter initialization
    } else {
        const currentCount = snapshot.val().count; // Current count value
        newCount = currentCount + 1;  // Increment counter
        await customerCountRef.set({ count: newCount }); // Store incremented count
        console.log(`Ticket number incremented to: ${newCount}`); // Log new ticket number
    }

    return newCount;
}

// Send email via Postmark
async function sendPostmarkEmail(data) {
    const emailPayload = {
        From: POSTMARK_FROM_EMAIL,
        To: data.email,
        TemplateAlias: POSTMARK_TEMPLATE_ALIAS,
        TemplateModel: {
            name: data.name,
            ticketNumber: data.ticketNumber,
            phone: data.phone,
            carYear: data.carYear,
            carMake: data.carMake,
            carModel: data.carModel,
            carTrim: data.carTrim,
            comments: data.comments,
        },
    };

    await postmarkClient.sendEmailWithTemplate(emailPayload); // Send email
    console.log("Postmark email payload:", emailPayload); // Log email payload
}

// Send webhook to Pushcut
async function sendWebhook(data) {
    await fetch(PUSHCUT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `New submission received. Ticket #${data.ticketNumber}`,
            ...data
        })
    });
    console.log("Pushcut webhook sent with data:", data); // Log webhook payload
}

// Start Express server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000"); // Log server start
});