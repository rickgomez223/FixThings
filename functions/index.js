const functions = require("firebase-functions");
const admin = require("firebase-admin");
const postmark = require("postmark");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com/"
});

const db = admin.firestore();

async function getApiKeys() {
  try {
    const snapshot = await admin.database().ref("apiKeys").once("value");
    const apiKeys = snapshot.val();

    if (!apiKeys) throw new Error("No API keys found in Firebase.");

    return { 
      POSTMARK_SERVER_KEY: apiKeys.POSTMARK_SERVER_KEY,
      PUSHCUT_WEBHOOK_URL: apiKeys.PUSHCUT_WEBHOOK_URL 
    };
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    throw new Error("Failed to fetch API keys.");
  }
}

exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    console.log("Received form submission request:", req.body);

    const { formData } = req.body;
    if (!formData || !formData.email || !formData.name) {
      console.warn("Missing required form data:", formData);
      return res.status(400).json({ success: false, message: "Missing required fields: name and email are required." });
    }

    const { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL } = await getApiKeys();

    const ticketNumber = await incrementTicketNumber();
    formData.ticketNumber = ticketNumber;
    await db.collection("formSubmissions").add(formData);
    console.log("Form data saved to Firestore:", formData);

    const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);
    const emailPayload = {
      From: "kyle@fixthings.pro",
      To: formData.email,
      TemplateAlias: "CustomerSignupEmail",
      TemplateModel: {
        name: formData.name,
        ticketNumber: formData.ticketNumber,
        phone: formData.phone,
        carYear: formData.carYear,
        carMake: formData.carMake,
        carModel: formData.carModel,
        carTrim: formData.carTrim,
        comments: formData.comments
      }
    };

    console.log("Sending email with payload:", emailPayload);
    await postmarkClient.sendEmailWithTemplate(emailPayload);
    console.log("Email sent to:", formData.email);

    await sendWebhook(PUSHCUT_WEBHOOK_URL, formData);

    res.status(200).json({ success: true, ticketNumber });
    console.log(`Response sent with ticket number: ${ticketNumber}`);

  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

async function incrementTicketNumber() {
  const customerCountRef = db.collection("meta").doc("customerCount");
  const snapshot = await customerCountRef.get();
  const newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
  await customerCountRef.set({ count: newCount });
  return newCount;
}

async function sendWebhook(webhookUrl, data) {
  try {
    const fetch = await import("node-fetch").then(module => module.default);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `New submission received. Ticket #${data.ticketNumber}`,
        ...data
      })
    });

    if (!response.ok) throw new Error(`Pushcut webhook failed with status ${response.status}`);

    console.log("Webhook notification sent.");
  } catch (error) {
    console.error("Failed to send webhook:", error);
    throw new Error("Webhook sending failed: " + error.message);
  }
}









// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const postmark = require("postmark");

// // Initialize the Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com/" // Replace with your database URL
// });

// // Initialize Firestore
// const db = admin.firestore();

// // Function to fetch API keys from Firebase
// async function getApiKeys() {
//   try {
//     const snapshot = await admin.database().ref('apiKeys').once('value');
//     const apiKeys = snapshot.val();

//     if (!apiKeys) {
//       throw new Error("No API keys found in Firebase.");
//     }

//     const PRIVATE_KEY = apiKeys.PRIVATE_KEY; // No longer needed for plain text
//     const POSTMARK_SERVER_KEY = apiKeys.POSTMARK_SERVER_KEY;
//     const PUSHCUT_WEBHOOK_URL = apiKeys.PUSHCUT_WEBHOOK_URL;

//     return { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL };
//   } catch (error) {
//     console.error("Error fetching API keys from Firebase:", error);
//     throw new Error("Failed to fetch API keys from Firebase.");
//   }
// }

// // Cloud Function to handle form submissions
// exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method Not Allowed" });
//   }

//   try {
//     console.log("Received form submission request");
//     console.log("Incoming request body:", req.body);

//     const { data: formData } = req.body; // Directly assign `formData` as plain text JSON
//     if (!formData) {
//       console.warn("No data provided in request.");
//       return res.status(400).json({ success: false, message: "No data provided" });
//     }

//     // Fetch API keys
//     const { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL } = await getApiKeys();
//     console.log("Fetched API Keys:", { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL });

//     // Commented out decryption since data is plain text
//     // const formData = JSON.parse(decryptedData);
//     console.log("Received form data:", formData);

//     // Validate required fields
//     if (!formData.email || !formData.name) {
//       console.warn("Validation failed: Missing required fields.");
//       return res.status(400).json({ success: false, message: "Validation failed: Missing required fields" });
//     }

//     // Increment ticket number and save to Firestore
//     const ticketNumber = await incrementTicketNumber();
//     formData.ticketNumber = ticketNumber;
//     await db.collection("formSubmissions").add(formData);
//     console.log("Form data saved to Firestore:", formData);

//     // Initialize Postmark client with the fetched key
//     const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);
    
//     // Prepare and send email
//     const emailPayload = {
//       From: "kyle@fixthings.pro",
//       To: formData.email,
//       TemplateAlias: "CustomerSignupEmail",
//       TemplateModel: {
//         name: formData.name,
//         ticketNumber: formData.ticketNumber,
//         phone: formData.phone,
//         carYear: formData.carYear,
//         carMake: formData.carMake,
//         carModel: formData.carModel,
//         carTrim: formData.carTrim,
//         comments: formData.comments,
//       },
//     };
    
//     console.log("Sending email with payload:", emailPayload);
//     await postmarkClient.sendEmailWithTemplate(emailPayload);
//     console.log("Email sent successfully to:", formData.email);

//     // Send webhook notification
//     await sendWebhook(PUSHCUT_WEBHOOK_URL, formData);
    
//     // Respond with success
//     res.status(200).json({ success: true, ticketNumber });
//     console.log(`Response sent with ticket number: ${ticketNumber}`);

//   } catch (error) {
//     console.error("Form submission failed:", error);
//     res.status(500).json({ success: false, message: "Form submission failed: " + error.message });
//   }
// });

// // Function to increment ticket number
// async function incrementTicketNumber() {
//   const customerCountRef = db.collection("meta").doc("customerCount");
//   const snapshot = await customerCountRef.get();

//   let newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
//   await customerCountRef.set({ count: newCount });
//   return newCount;
// }

// // Function to send webhook notification
// async function sendWebhook(webhookUrl, data) {
//   try {
//     const fetch = await import('node-fetch').then(module => module.default);
//     const response = await fetch(webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: `New submission received. Ticket #${data.ticketNumber}`,
//         ...data
//       })
//     });
    
//     if (!response.ok) {
//       throw new Error(`Pushcut webhook failed with status: ${response.status}`);
//     }

//     console.log("Webhook notification sent successfully.");
//   } catch (error) {
//     console.error("Error sending Pushcut webhook:", error.message);
//     throw new Error("Webhook sending failed: " + error.message);
//   }
// }


// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const crypto = require("crypto");
// const postmark = require("postmark");

// // Initialize the Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com/" // Replace with your database URL
// });

// // Initialize Firestore
// const db = admin.firestore();

// // Function to fetch API keys from Firebase
// async function getApiKeys() {
//   try {
//     const snapshot = await admin.database().ref('apiKeys').once('value');
//     const apiKeys = snapshot.val();

//     if (!apiKeys) {
//       throw new Error("No API keys found in Firebase.");
//     }

//     // Directly assign the keys without decoding
//     const PRIVATE_KEY = apiKeys.PRIVATE_KEY;
//     const POSTMARK_SERVER_KEY = apiKeys.POSTMARK_SERVER_KEY;
//     const PUSHCUT_WEBHOOK_URL = apiKeys.PUSHCUT_WEBHOOK_URL;

//     return { PRIVATE_KEY, POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL };
//   } catch (error) {
//     console.error("Error fetching API keys from Firebase:", error);
//     throw new Error("Failed to fetch API keys from Firebase.");
//   }
// }

// // Cloud Function to handle form submissions
// exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method Not Allowed" });
//   }

//   try {
//     console.log("Received form submission request");
//     console.log("Incoming request body:", req.body);

//     const { data: encryptedData } = req.body;
//     if (!encryptedData) {
//       console.warn("No encrypted data provided in request.");
//       return res.status(400).json({ success: false, message: "No data provided" });
//     }

//     // Fetch API keys
//     const { PRIVATE_KEY, POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL } = await getApiKeys();
//     console.log("Fetched API Keys:", { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL });

//     // Decrypt the incoming data
//     const decryptedData = decryptWithPrivateKey(encryptedData, PRIVATE_KEY);
//     const formData = JSON.parse(decryptedData);
//     console.log("Decrypted form data:", formData);

//     // Validate required fields
//     if (!formData.email || !formData.name) {
//       console.warn("Validation failed: Missing required fields.");
//       return res.status(400).json({ success: false, message: "Validation failed: Missing required fields" });
//     }

//     // Increment ticket number and save to Firestore
//     const ticketNumber = await incrementTicketNumber();
//     formData.ticketNumber = ticketNumber;
//     await db.collection("formSubmissions").add(formData);
//     console.log("Form data saved to Firestore:", formData);

//     // Initialize Postmark client with the fetched key
//     const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);
    
//     // Prepare and send email
//     const emailPayload = {
//       From: "kyle@fixthings.pro",
//       To: formData.email,
//       TemplateAlias: "CustomerSignupEmail",
//       TemplateModel: {
//         name: formData.name,
//         ticketNumber: formData.ticketNumber,
//         phone: formData.phone,
//         carYear: formData.carYear,
//         carMake: formData.carMake,
//         carModel: formData.carModel,
//         carTrim: formData.carTrim,
//         comments: formData.comments,
//       },
//     };
    
//     console.log("Sending email with payload:", emailPayload);
//     await postmarkClient.sendEmailWithTemplate(emailPayload);
//     console.log("Email sent successfully to:", formData.email);

//     // Send webhook notification
//     await sendWebhook(PUSHCUT_WEBHOOK_URL, formData);
    
//     // Respond with success
//     res.status(200).json({ success: true, ticketNumber });
//     console.log(`Response sent with ticket number: ${ticketNumber}`);

//   } catch (error) {
//     console.error("Form submission failed:", error);
//     res.status(500).json({ success: false, message: "Form submission failed: " + error.message });
//   }
// });

// // Function to decrypt data with the private key
// function decryptWithPrivateKey(encryptedData, privateKey) {
//   try {
//     // Create a private key object from the OpenSSH formatted private key
//     const privateKeyObj = crypto.createPrivateKey({
//       key: privateKey,
//       format: 'pem',
//       type: 'spki', // Use 'pkcs8' for OpenSSH keys
//     });

//     return crypto.privateDecrypt(
//       {
//         key: privateKeyObj,
//         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//         oaepHash: "sha256",
//       },
//       Buffer.from(encryptedData, 'base64')
//     ).toString('utf8');
//   } catch (error) {
//     console.error("Decryption failed:", error.message);
//     throw new Error("Decryption failed: " + error.message);
//   }
// }

// // Function to increment ticket number
// async function incrementTicketNumber() {
//   const customerCountRef = db.collection("meta").doc("customerCount");
//   const snapshot = await customerCountRef.get();

//   let newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
//   await customerCountRef.set({ count: newCount });
//   return newCount;
// }

// // Function to send webhook notification
// async function sendWebhook(webhookUrl, data) {
//   try {
//     const fetch = await import('node-fetch').then(module => module.default);
//     const response = await fetch(webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: `New submission received. Ticket #${data.ticketNumber}`,
//         ...data
//       })
//     });
    
//     if (!response.ok) {
//       throw new Error(`Pushcut webhook failed with status: ${response.status}`);
//     }

//     console.log("Webhook notification sent successfully.");
//   } catch (error) {
//     console.error("Error sending Pushcut webhook:", error.message);
//     throw new Error("Webhook sending failed: " + error.message);
//   }
// }