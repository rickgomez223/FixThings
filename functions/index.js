const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.emailCustomerLead = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests are accepted' });
  }

  const postmarkPayload = req.body;

  // Validate payload
  if (!postmarkPayload.To || !postmarkPayload.TemplateId || !postmarkPayload.TemplateModel) {
    return res.status(400).send({ message: 'Invalid Postmark payload: Missing required fields' });
  }

  try {
    // Fetch Postmark API key from Realtime Database
    const snapshot = await admin.database().ref('apiKeys/POSTMARK_SERVER_KEY').once('value');
    const postmarkKey = snapshot.val();

    if (!postmarkKey) {
      throw new Error('Postmark API key not found in Realtime Database');
    }

    const client = new postmark.ServerClient(postmarkKey);

    // Send the email using the provided template
    const emailResponse = await client.sendEmailWithTemplate({
      From: 'kyle@fixthings.pro', // Sender email
      To: postmarkPayload.To,
      TemplateAlias: postmarkPayload.TemplateId, // Postmark Template ID
      TemplateModel: postmarkPayload.TemplateModel, // Dynamic data for the template
      Cc: postmarkPayload.Cc || 'rickgomez223@gmail.com', // Optional CC field
      Bcc: postmarkPayload.Bcc || '', // Optional BCC field
    });

    res.status(200).send({ message: 'Email sent successfully', response: emailResponse });
  } catch (error) {
    console.error('Postmark Error:', error);
    res.status(500).send({ message: 'Failed to send email', error: error.message });
  }
});