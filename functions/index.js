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








// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const crypto = require("crypto");

// // Initialize Firebase Admin
// admin.initializeApp();
// const db = admin.firestore();

// // Retrieve private key from Firebase environment variables
// const PRIVATE_KEY_BASE64 = functions.config().myapp.private_key;
// const privateKeyPEM = Buffer.from(PRIVATE_KEY_BASE64, "base64").toString("utf8");

// exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
//   // Validate the request method
//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method Not Allowed" });
//   }

//   try {
//     const { encryptedData } = req.body;

//     if (!encryptedData) {
//       throw new Error("No data provided for decryption");
//     }

//     // Decode and decrypt the data
//     const decryptedData = decryptData(encryptedData);
//     const formData = JSON.parse(decryptedData);

//     // Generate a ticket number
//     const ticketNumber = `TICKET-${Date.now().toString().slice(-6)}`;

//     // Save to Firestore
//     await db.collection("formSubmissions").add({ ...formData, ticketNumber });

//     // Send back the success response
//     res.status(200).json({
//       success: true,
//       ticketNumber,
//       message: "Form submitted successfully",
//     });
//   } catch (error) {
//     console.error("Error handling form submission:", error);
//     res.status(500).json({ success: false, message: "Server error during submission." });
//   }
// });

// // Helper function to decrypt the data
// function decryptData(encryptedData) {
//   // Decode from base64 to get the encrypted buffer
//   const buffer = Buffer.from(encryptedData, "base64");

//   // Decrypt using RSA-OAEP with SHA-256 padding
//   const decrypted = crypto.privateDecrypt(
//     {
//       key: privateKeyPEM,
//       padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//       oaepHash: "sha256",
//     },
//     buffer
//   );

//   return decrypted.toString("utf8");
// }









// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const crypto = require("crypto");
// const postmark = require("postmark");
// const fetch = require("node-fetch");

// // Initialize Firebase Admin
// admin.initializeApp();
// const db = admin.firestore();

// // Load private key from Firebase config (base64-encoded)
// const PRIVATE_KEY_BASE64 = functions.config().myapp.private_key;
// const privateKeyPEM = Buffer.from(PRIVATE_KEY_BASE64, 'base64').toString('utf8');

// // Postmark setup
// const POSTMARK_SERVER_KEY = Buffer.from(functions.config().myapp.postmark_server_key, 'base64').toString('utf8');
// const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);

// // Pushcut Webhook URL
// const PUSHCUT_WEBHOOK_URL = Buffer.from(functions.config().myapp.pushcut_webhook_url, 'base64').toString('utf8');

// // Form submission handler
// exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
//   // Validate request method
//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method Not Allowed" });
//   }

//   try {
//     console.log("Received form submission request");

//     // Step 1: Decrypt incoming data
//     const encryptedData = req.body.data;
//     const decryptedData = decryptWithPrivateKey(encryptedData);
//     const formData = JSON.parse(decryptedData);

//     // Step 2: Validate formData
//     if (!formData.email || !formData.name) {
//       return res.status(400).json({ success: false, message: "Validation failed: Missing required fields" });
//     }

//     // Step 3: Increment ticket number and store data
//     const ticketNumber = await incrementTicketNumber();
//     formData.ticketNumber = ticketNumber;
//     await db.collection("formSubmissions").add(formData);

//     // Step 4: Send confirmation email via Postmark
//     await sendPostmarkEmail(formData);

//     // Step 5: Send webhook notification
//     await sendWebhook(formData);

//     // Step 6: Respond to client
//     res.status(200).json({ success: true, ticketNumber });
//     console.log(`Response sent with ticket number: ${ticketNumber}`);

//   } catch (error) {
//     console.error("Form submission failed:", error);
//     res.status(500).json({ success: false, message: "Form submission failed" });
//   }
// });

// // Decrypt function with error handling
// function decryptWithPrivateKey(encryptedData) {
//   try {
//     return crypto.privateDecrypt(
//       {
//         key: privateKeyPEM,
//         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//       },
//       Buffer.from(encryptedData, 'base64')
//     ).toString('utf8');
//   } catch (error) {
//     throw new Error("Decryption failed: " + error.message);
//   }
// }

// // Firebase helper to increment ticket number
// async function incrementTicketNumber() {
//   const customerCountRef = db.collection("meta").doc("customerCount");
//   const snapshot = await customerCountRef.get();

//   let newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
//   await customerCountRef.set({ count: newCount });
//   return newCount;
// }

// // Send email via Postmark
// async function sendPostmarkEmail(data) {
//   const emailPayload = {
//     From: "kyle@fixthings.pro",
//     To: data.email,
//     TemplateAlias: "CustomerSignupEmail",
//     TemplateModel: {
//       name: data.name,
//       ticketNumber: data.ticketNumber,
//       phone: data.phone,
//       carYear: data.carYear,
//       carMake: data.carMake,
//       carModel: data.carModel,
//       carTrim: data.carTrim,
//       comments: data.comments,
//     },
//   };
//   await postmarkClient.sendEmailWithTemplate(emailPayload);
// }

// // Send webhook to Pushcut
// async function sendWebhook(data) {
//   await fetch(PUSHCUT_WEBHOOK_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       message: `New submission received. Ticket #${data.ticketNumber}`,
//       ...data
//     })
//   });
// }




const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const postmark = require("postmark");
const fetch = require("node-fetch");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Load configuration securely
const PRIVATE_KEY_BASE64 = functions.config().myapp.private_key;
const POSTMARK_SERVER_KEY_BASE64 = functions.config().myapp.postmark_server_key;
const PUSHCUT_WEBHOOK_URL_BASE64 = functions.config().myapp.pushcut_webhook_url;

if (!PRIVATE_KEY_BASE64 || !POSTMARK_SERVER_KEY_BASE64 || !PUSHCUT_WEBHOOK_URL_BASE64) {
  console.error("Missing necessary configuration in environment variables.");
  throw new Error("Missing necessary environment configuration.");
}

// Decode configuration variables
const privateKeyPEM = Buffer.from(PRIVATE_KEY_BASE64, 'base64').toString('utf8');
const POSTMARK_SERVER_KEY = Buffer.from(POSTMARK_SERVER_KEY_BASE64, 'base64').toString('utf8');
const PUSHCUT_WEBHOOK_URL = Buffer.from(PUSHCUT_WEBHOOK_URL_BASE64, 'base64').toString('utf8');

// Initialize Postmark client
const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);

// Form submission handler
exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    console.log("Received form submission request");

    // Step 1: Validate and decrypt incoming data
    const { data: encryptedData } = req.body;
    if (!encryptedData) {
      console.warn("No encrypted data provided in request.");
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    const decryptedData = decryptWithPrivateKey(encryptedData);
    const formData = JSON.parse(decryptedData);

    // Step 2: Validate formData
    if (!formData.email || !formData.name) {
      console.warn("Validation failed: Missing required fields.");
      return res.status(400).json({ success: false, message: "Validation failed: Missing required fields" });
    }

    // Step 3: Increment ticket number and store data
    const ticketNumber = await incrementTicketNumber();
    formData.ticketNumber = ticketNumber;
    await db.collection("formSubmissions").add(formData);

    // Step 4: Send confirmation email via Postmark
    await sendPostmarkEmail(formData);

    // Step 5: Send webhook notification
    await sendWebhook(formData);

    // Step 6: Respond to client
    res.status(200).json({ success: true, ticketNumber });
    console.log(`Response sent with ticket number: ${ticketNumber}`);

  } catch (error) {
    console.error("Form submission failed:", error);
    res.status(500).json({ success: false, message: "Form submission failed" });
  }
});

// Decrypt function with error handling
function decryptWithPrivateKey(encryptedData) {
  try {
    return crypto.privateDecrypt(
      {
        key: privateKeyPEM,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, 'base64')
    ).toString('utf8');
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Decryption failed: " + error.message);
  }
}

// Firebase helper to increment ticket number
async function incrementTicketNumber() {
  const customerCountRef = db.collection("meta").doc("customerCount");
  const snapshot = await customerCountRef.get();

  let newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
  await customerCountRef.set({ count: newCount });
  return newCount;
}

// Send email via Postmark with error handling
async function sendPostmarkEmail(data) {
  const emailPayload = {
    From: "kyle@fixthings.pro",
    To: data.email,
    TemplateAlias: "CustomerSignupEmail",
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

  try {
    await postmarkClient.sendEmailWithTemplate(emailPayload);
    console.log("Email sent successfully to:", data.email);
  } catch (error) {
    console.error("Error sending email via Postmark:", error.message);
    throw new Error("Email sending failed: " + error.message);
  }
}

// Send webhook to Pushcut with error handling
async function sendWebhook(data) {
  try {
    const response = await fetch(PUSHCUT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `New submission received. Ticket #${data.ticketNumber}`,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Pushcut webhook failed with status: ${response.status}`);
    }

    console.log("Webhook notification sent successfully.");
  } catch (error) {
    console.error("Error sending Pushcut webhook:", error.message);
    throw new Error("Webhook sending failed: " + error.message);
  }
}



















