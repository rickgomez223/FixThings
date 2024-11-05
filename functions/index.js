const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const postmark = require("postmark");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Load environment variables directly
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POSTMARK_SERVER_KEY = process.env.POSTMARK_SERVER_KEY;
const PUSHCUT_WEBHOOK_URL = process.env.PUSHCUT_WEBHOOK_URL;

if (!PRIVATE_KEY || !POSTMARK_SERVER_KEY || !PUSHCUT_WEBHOOK_URL) {
  console.error("Missing necessary configuration in environment variables.");
  throw new Error("Missing necessary environment configuration.");
}

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
        key: PRIVATE_KEY,
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
    const fetch = await import('node-fetch').then(module => module.default); // Dynamically import node-fetch
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