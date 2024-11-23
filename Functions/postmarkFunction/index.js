/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


const admin = require("firebase-admin");
const postmark = require('postmark');
const cors = require('cors')({ origin: true }); // Allow all origins for now

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.emailCustomerLead = onRequest((req, res) => {
  // Apply CORS middleware here
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send({ message: 'Only POST requests are accepted' });
    }

    const postmarkPayload = req.body;

    if (!postmarkPayload.To || !postmarkPayload.TemplateAlias || !postmarkPayload.TemplateModel) {
      return res.status(400).send({ message: 'Invalid Postmark payload: Missing required fields' });
    }

    try {
      // Fetch the Postmark API key from Firebase Realtime Database
      const snapshot = await admin.database().ref('apiKeys/POSTMARK_SERVER_KEY').once('value');
      const postmarkKey = snapshot.val();

      if (!postmarkKey) {
        throw new Error('Postmark API key not found in Realtime Database');
      }

      // Create Postmark client with the API key
      const client = new postmark.ServerClient(postmarkKey);

      // Send the email using the Postmark template
      const emailResponse = await client.sendEmailWithTemplate({
        From: 'kyle@fixthings.pro',
        To: postmarkPayload.To,
        TemplateAlias: postmarkPayload.TemplateAlias,
        TemplateModel: postmarkPayload.TemplateModel,
        Cc: postmarkPayload.Cc || 'rickgomez223@gmail.com',
        Bcc: postmarkPayload.Bcc || '',
      });

      res.status(200).send({ message: 'Email sent successfully', response: emailResponse });
    } catch (error) {
      console.error('Postmark Error:', error);
      res.status(500).send({ message: 'Failed to send email', error: error.message });
    }
  });
});