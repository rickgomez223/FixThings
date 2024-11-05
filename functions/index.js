const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const postmark = require("postmark");

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Ensure your environment has access to your service account key
  databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com/" // Replace with your database URL
});

// Initialize Firestore
const db = admin.firestore();

// Function to fetch API keys from Firebase
async function getApiKeys() {
  try {
    const snapshot = await admin.database().ref('apikeys').once('value');
    const apiKeys = snapshot.val();

    if (!apiKeys) {
      throw new Error("No API keys found in Firebase.");
    }

    const PRIVATE_KEY = Buffer.from(apiKeys.PRIVATE_KEY, 'base64').toString('utf-8');
    const POSTMARK_SERVER_KEY = Buffer.from(apiKeys.POSTMARK_SERVER_KEY, 'base64').toString('utf-8');
    const PUSHCUT_WEBHOOK_URL = Buffer.from(apiKeys.PUSHCUT_WEBHOOK_URL, 'base64').toString('utf-8');

    return { PRIVATE_KEY, POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL };
  } catch (error) {
    console.error("Error fetching API keys from Firebase:", error);
    throw new Error("Failed to fetch API keys from Firebase.");
  }
}

// Cloud Function to handle form submissions
exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    console.log("Received form submission request");

    const { data: encryptedData } = req.body;
    if (!encryptedData) {
      console.warn("No encrypted data provided in request.");
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    // Fetch API keys
    const { PRIVATE_KEY, POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL } = await getApiKeys();
    
    const decryptedData = decryptWithPrivateKey(encryptedData, PRIVATE_KEY);
    const formData = JSON.parse(decryptedData);

    if (!formData.email || !formData.name) {
      console.warn("Validation failed: Missing required fields.");
      return res.status(400).json({ success: false, message: "Validation failed: Missing required fields" });
    }

    const ticketNumber = await incrementTicketNumber();
    formData.ticketNumber = ticketNumber;
    await db.collection("formSubmissions").add(formData);

    // Initialize Postmark client with the fetched key
    const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);
    await sendPostmarkEmail(postmarkClient, formData);
    await sendWebhook(PUSHCUT_WEBHOOK_URL, formData);

    res.status(200).json({ success: true, ticketNumber });
    console.log(`Response sent with ticket number: ${ticketNumber}`);

  } catch (error) {
    console.error("Form submission failed:", error);
    res.status(500).json({ success: false, message: "Form submission failed: " + error.message });
  }
});

// Function to decrypt data with the private key
function decryptWithPrivateKey(encryptedData, privateKey) {
  try {
    return crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, 'base64')
    ).toString('utf8');
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Decryption failed: " + error.message);
  }
}

// Function to increment ticket number
async function incrementTicketNumber() {
  const customerCountRef = db.collection("meta").doc("customerCount");
  const snapshot = await customerCountRef.get();

  let newCount = snapshot.exists ? snapshot.data().count + 1 : 1;
  await customerCountRef.set({ count: newCount });
  return newCount;
}

// Function to send email using Postmark
async function sendPostmarkEmail(postmarkClient, data) {
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

// Function to send webhook notification
async function sendWebhook(webhookUrl, data) {
  try {
    const fetch = await import('node-fetch').then(module => module.default);
    const response = await fetch(webhookUrl, {
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