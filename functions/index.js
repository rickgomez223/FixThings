const express = require("express");
const crypto = require("crypto");
const firebase = require("firebase-admin");
const postmark = require("postmark");
const bodyParser = require("body-parser");
const fs = require("fs");
const functions = require('firebase-functions');


// === Configuration Variables ===

const PRIVATE_KEY_PATH = functions.config().myapp.private_key;  // Access your private key
const FIREBASE_DB_URL = functions.config().myapp.firebase_db_url;  // Access your Firebase DB URL

// Postmark configuration
const POSTMARK_SERVER_KEY = functions.config().myapp.postmark_server_key;
const POSTMARK_FROM_EMAIL = "kyle@fixthings.pro";
const POSTMARK_TEMPLATE_ALIAS = "CustomerSignupEmail";

// Pushcut Webhook URL
const PUSHCUT_WEBHOOK_URL = functions.config().myapp.pushcut_webhook_url;

// ================================

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Firebase setup
firebase.initializeApp({
    credential: firebase.credential.applicationDefault(),
    databaseURL: FIREBASE_DB_URL
});
const db = firebase.database();

// Load private key for decryption
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");

// Postmark setup
const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);

// Route for form submission
app.post("/submit", async (req, res) => {
    try {
        // Step 1: Decrypt the incoming data
        const encryptedData = req.body.data;
        const decryptedData = decryptWithPrivateKey(encryptedData);
        const formData = JSON.parse(decryptedData);

        // Step 2: Increment ticket number and store data
        const ticketNumber = await incrementTicketNumber();
        formData.ticketNumber = ticketNumber;
        await db.ref(`customers/${ticketNumber}`).set(formData);

        // Step 3: Send confirmation email via Postmark
        await sendPostmarkEmail(formData);

        // Step 4: Send webhook
        await sendWebhook(formData);

        // Step 5: Respond to client
        res.json({ ticketNumber });
    } catch (error) {
        console.error("Form submission failed:", error);
        res.status(500).json({ message: "Form submission failed" });
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
    const customerCountRef = db.ref("meta/customerCount");
    const snapshot = await customerCountRef.once("value");

    let newCount;
    if (!snapshot.exists()) {
        newCount = 1;
        await customerCountRef.set({ count: newCount });
    } else {
        const currentCount = snapshot.val().count;
        newCount = currentCount + 1;
        await customerCountRef.set({ count: newCount });
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

    await postmarkClient.sendEmailWithTemplate(emailPayload);
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
}

// Start Express server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});




























