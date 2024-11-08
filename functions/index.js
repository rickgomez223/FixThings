// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const postmark = require("postmark");

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://data.fixthings.pro"
// });

// // You no longer need Firestore since you're using Realtime Database
// // const db = admin.firestore(); // Removed

// async function getApiKeys() {
//   try {
//     const snapshot = await admin.database().ref("apiKeys").once("value");
//     const apiKeys = snapshot.val();

//     if (!apiKeys) throw new Error("No API keys found in Firebase.");
    
//     return { 
//       POSTMARK_SERVER_KEY: apiKeys.POSTMARK_SERVER_KEY,
//       PUSHCUT_WEBHOOK_URL: apiKeys.PUSHCUT_WEBHOOK_URL 
//     };
//   } catch (error) {
//     console.error("Failed to fetch API keys:", error);
//     throw new Error("Failed to fetch API keys.");
//   }
// }

// exports.formSubmitHandler = functions.https.onRequest(async (req, res) => {
//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method Not Allowed" });
//   }

//   try {
//     console.log("Received form submission request:", req.body);

//     const { formData } = req.body;
//     if (!formData || !formData.email || !formData.name) {
//       console.warn("Missing required form data:", formData);
//       return res.status(400).json({ success: false, message: "Missing required fields: name and email are required." });
//     }

//     const { POSTMARK_SERVER_KEY, PUSHCUT_WEBHOOK_URL } = await getApiKeys();

//     // Increment the ticket number and attach it to the form data
//     const ticketNumber = await incrementTicketNumber();
//     formData.ticketNumber = ticketNumber;

//     // Save form data to the Realtime Database
//     const customerRef = admin.database().ref("customers").child(ticketNumber);
//     await customerRef.set(formData);
//     console.log("Form data saved to Realtime Database:", formData);
    
//     // Prepare and send the email
//     const postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_KEY);
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
//         comments: formData.comments
//       }
//     };

//     console.log("Sending email with payload:", emailPayload);
//     await postmarkClient.sendEmailWithTemplate(emailPayload);
//     console.log("Email sent to:", formData.email);

//     // Send a webhook notification
//     await sendWebhook(PUSHCUT_WEBHOOK_URL, formData);

//     // Respond back with success and the ticket number
//     res.status(200).json({ success: true, ticketNumber });
//     console.log(`Response sent with ticket number: ${ticketNumber}`);

//   } catch (error) {
//     console.error("Form submission error:", error);
//     res.status(500).json({ success: false, message: "Server error: " + error.message });
//   }
// });

// async function incrementTicketNumber() {
//   const customerCountRef = admin.database().ref("meta/customerCount");

//   // Use a transaction to increment the ticket number atomically
//   const newCount = await customerCountRef.transaction(currentCount => {
//     return (currentCount || 0) + 1; // Start from 0 if it doesn't exist
//   });

//   // Return the new ticket number
//   return newCount;
// }

// async function sendWebhook(webhookUrl, data) {
//   try {
//     const fetch = await import("node-fetch").then(module => module.default);
//     const response = await fetch(webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         message: `New submission received. Ticket #${data.ticketNumber}`,
//         ...data
//       })
//     });

//     if (!response.ok) throw new Error(`Pushcut webhook failed with status ${response.status}`);

//     console.log("Webhook notification sent.");
//   } catch (error) {
//     console.error("Failed to send webhook:", error);
//     throw new Error("Webhook sending failed: " + error.message);
//   }
// }




// exports.proxyDatabase = functions.https.onRequest(async (req, res) => {
//   const dbRef = admin.database().ref(req.path); // Dynamic database reference based on request path

//   try {
//     if (req.method === 'GET') {
//       const snapshot = await dbRef.once('value');
//       res.status(200).send(snapshot.val());
//     } else if (req.method === 'POST') {
//       await dbRef.set(req.body); // Assuming req.body contains the data to save
//       res.status(200).send({ success: true });
//     } else {
//       res.status(405).send({ error: 'Method Not Allowed' });
//     }
//   } catch (error) {
//     console.error('Database error:', error);
//     res.status(500).send({ error: 'Database error' });
//   }
// });
