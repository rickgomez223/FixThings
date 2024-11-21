// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const postmark = require('postmark');
// const cors = require('cors')({ origin: true }); // Allow all origins for now

// admin.initializeApp();

// exports.emailCustomerLead = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {  // Apply CORS middleware here
//     if (req.method !== 'POST') {
//       return res.status(405).send({ message: 'Only POST requests are accepted' });
//     }

//     const postmarkPayload = req.body;

//     if (!postmarkPayload.To || !postmarkPayload.TemplateAlias || !postmarkPayload.TemplateModel) {
//       return res.status(400).send({ message: 'Invalid Postmark payload: Missing required fields' });
//     }

//     try {
//       const snapshot = await admin.database().ref('apiKeys/POSTMARK_SERVER_KEY').once('value');
//       const postmarkKey = snapshot.val();

//       if (!postmarkKey) {
//         throw new Error('Postmark API key not found in Realtime Database');
//       }

//       const client = new postmark.ServerClient(postmarkKey);

//       const emailResponse = await client.sendEmailWithTemplate({
//         From: 'kyle@fixthings.pro',
//         To: postmarkPayload.To,
//         TemplateAlias: postmarkPayload.TemplateAlias,
//         TemplateModel: postmarkPayload.TemplateModel,
//         Cc: postmarkPayload.Cc || 'rickgomez223@gmail.com',
//         Bcc: postmarkPayload.Bcc || '',
//       });

//       res.status(200).send({ message: 'Email sent successfully', response: emailResponse });
//     } catch (error) {
//       console.error('Postmark Error:', error);
//       res.status(500).send({ message: 'Failed to send email', error: error.message });
//     }
//   });
// });