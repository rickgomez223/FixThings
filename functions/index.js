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