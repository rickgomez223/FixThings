const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');
const cors = require('cors')({ origin: true }); // Allow all origins for now

admin.initializeApp();

exports.emailCustomerLead = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {  // Apply CORS middleware here
    if (req.method !== 'POST') {
      return res.status(405).send({ message: 'Only POST requests are accepted' });
    }

    const postmarkPayload = req.body;

    if (!postmarkPayload.To || !postmarkPayload.TemplateAlias || !postmarkPayload.TemplateModel) {
      return res.status(400).send({ message: 'Invalid Postmark payload: Missing required fields' });
    }

    try {
      const snapshot = await admin.database().ref('apiKeys/POSTMARK_SERVER_KEY').once('value');
      const postmarkKey = snapshot.val();

      if (!postmarkKey) {
        throw new Error('Postmark API key not found in Realtime Database');
      }

      const client = new postmark.ServerClient(postmarkKey);

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


const cloudinary = require('cloudinary').v2;  // Cloudinary SDK



// Firebase Realtime Database reference for Cloudinary config
const db = admin.database();
const cloudinaryRef = db.ref('apiKeys');

// Firebase function to upload image to Cloudinary
exports.uploadImageToCloudinary = functions.https.onRequest(async (req, res) => {
  try {
    // Check that the request is a POST and contains an image
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    if (!req.body || !req.body.image) {
      return res.status(400).send('No image provided');
    }

    const imageBase64 = req.body.image; // Base64 image string sent in the body

    // Fetch Cloudinary keys from Realtime Database
    const snapshot = await cloudinaryRef.once('value');
    const cloudinaryConfig = snapshot.val();

    if (!cloudinaryConfig || !cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      return res.status(500).send('Cloudinary configuration not found');
    }

    // Configure Cloudinary with the retrieved keys
    cloudinary.config({
      cloud_name: cloudinaryConfig.Cloudinary_Name,
      api_key: cloudinaryConfig.Cloudinary_Key,
      api_secret: cloudinaryConfig.Cloudinary_Secret,
    });

    // Upload the image to Cloudinary (no preset or unsigned upload)
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: 'your-folder',  // Optional: Specify a folder in Cloudinary to store images
    });

    // Send back the Cloudinary URL after successful upload
    return res.status(200).json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return res.status(500).send('Error uploading image');
  }
});