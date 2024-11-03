// // Import necessary modules
// const functions = require('firebase-functions');
// const express = require("express");
// const crypto = require("crypto");
// const firebase = require("firebase-admin");
// const postmark = require("postmark");
// const bodyParser = require("body-parser");
// const fetch = require("node-fetch");

// // Initialize Express app
// const app = express();
// app.use(bodyParser.json());

// // Initialize Firebase Admin SDK
// firebase.initializeApp({
//     credential: firebase.credential.applicationDefault(),
//     databaseURL: Buffer.from(functions.config().myapp.firebase_db_url, 'base64').toString('utf8')
// });
// const db = firebase.database();

// // Load private key from Firebase config (base64-encoded)
// const PRIVATE_KEY_BASE64 = functions.config().myapp.private_key;
// const privateKey = Buffer.from(PRIVATE_KEY_BASE64, 'base64').toString('utf8');

// // Postmark configuration
// const POSTMARK_SERVER_KEY = Buffer.from(functions.config().myapp.postmark_server_key, 'base64').toString('utf8');
// const POSTMARK_FROM_EMAIL = "kyle@fixthings.pro";
// const POSTMARK_TEMPLATE_ALIAS = "CustomerSignupEmail";

// // Pushcut Webhook URL
// const PUSHCUT_WEBHOOK_URL = Buffer.from(functions.config().myapp.pushcut_webhook_url, 'base64').toString('utf8');

// // Postmark setup
// const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);

// // Route for form submission
// app.post("/submit", async (req, res) => {
//     try {
//         console.log("Received form submission request");

//         // Step 1: Decrypt incoming data
//         const encryptedData = req.body.data;
//         const decryptedData = decryptWithPrivateKey(encryptedData);
//         const formData = JSON.parse(decryptedData);

//         // Step 2: Validate formData
//         if (!formData.email || !formData.name) {
//             return res.status(400).json({ message: "Validation failed: Missing required fields" });
//         }

//         // Step 3: Increment ticket number and store data
//         const ticketNumber = await incrementTicketNumber();
//         formData.ticketNumber = ticketNumber;
//         await db.ref(`customers/${ticketNumber}`).set(formData);

//         // Step 4: Send confirmation email via Postmark
//         await sendPostmarkEmail(formData);

//         // Step 5: Send webhook notification
//         await sendWebhook(formData);

//         // Step 6: Respond to client
//         res.json({ ticketNumber });
//         console.log(`Response sent with ticket number: ${ticketNumber}`);

//     } catch (error) {
//         console.error("Form submission failed:", error);
//         res.status(500).json({ message: "Form submission failed" });
//     }
// });

// // Decrypt function with error handling
// function decryptWithPrivateKey(encryptedData) {
//     try {
//         return crypto.privateDecrypt(
//             {
//                 key: privateKey,
//                 padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//             },
//             Buffer.from(encryptedData, 'base64')
//         ).toString('utf8');
//     } catch (error) {
//         throw new Error("Decryption failed: " + error.message);
//     }
// }

// // Firebase helper to increment ticket number
// async function incrementTicketNumber() {
//     const customerCountRef = db.ref("meta/customerCount");
//     const snapshot = await customerCountRef.once("value");

//     let newCount = snapshot.exists() ? snapshot.val().count + 1 : 1;
//     await customerCountRef.set({ count: newCount });
//     return newCount;
// }

// // Send email via Postmark
// async function sendPostmarkEmail(data) {
//     const emailPayload = {
//         From: POSTMARK_FROM_EMAIL,
//         To: data.email,
//         TemplateAlias: POSTMARK_TEMPLATE_ALIAS,
//         TemplateModel: {
//             name: data.name,
//             ticketNumber: data.ticketNumber,
//             phone: data.phone,
//             carYear: data.carYear,
//             carMake: data.carMake,
//             carModel: data.carModel,
//             carTrim: data.carTrim,
//             comments: data.comments,
//         },
//     };
//     await postmarkClient.sendEmailWithTemplate(emailPayload);
// }

// // Send webhook to Pushcut
// async function sendWebhook(data) {
//     await fetch(PUSHCUT_WEBHOOK_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//             message: `New submission received. Ticket #${data.ticketNumber}`,
//             ...data
//         })
//     });
// }

// // Export the Firebase Function
// exports.submitForm = functions.https.onRequest(app);








const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
  // Validate the request method
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { encryptedData } = req.body;

    if (!encryptedData) {
      throw new Error("No data provided for decryption");
    }

    // Decode and decrypt the data
    const decryptedData = await decryptData(encryptedData);
    const formData = JSON.parse(decryptedData);

    // Generate a ticket number
    const ticketNumber = `TICKET-${Date.now().toString().slice(-6)}`;

    // Save to Firestore (or Realtime Database as needed)
    await db.collection("formSubmissions").add({ ...formData, ticketNumber });

    // Send back the success response
    res.status(200).json({
      success: true,
      ticketNumber,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Error handling form submission:", error);
    res.status(500).json({ success: false, message: "Server error during submission." });
  }
});

// Helper function to decrypt the data
async function decryptData(encryptedData) {
	const PRIVATE_KEY_BASE64 = functions.config().myapp.private_key;
  const privateKeyPEM = Buffer.from(PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  const privateKey = importPrivateKey(privateKeyPEM);

  // Decode from base64
  const buffer = Buffer.from(encryptedData, "base64");

  // Decrypt using RSA-OAEP
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );

  return decrypted.toString("utf8");
}

// Convert PEM-format private key to Crypto Key
function importPrivateKey(pem) {
  const cleanPem = pem.replace(/-----\w+ PRIVATE KEY-----|\n/g, "");
  const binary = Buffer.from(cleanPem, "base64");
  return binary.toString("utf-8");
}

