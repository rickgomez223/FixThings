const functions = require('firebase-functions');
const admin = require('firebase-admin');
const postmark = require('postmark');
const cors = require('cors')({ origin: true }); // Allow all origins for now


// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com/" // Ensure the database URL is correct
});

const db = admin.database();  // Firebase Realtime Database reference
const apiKeysRef = admin.database().ref('apiKeys');  // Firebase Realtime DB reference for API keys

// Email Function using Postmark
exports.emailCustomerLead = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send({ message: 'Only POST requests are accepted' });
    }
    const postmarkPayload = req.body;
    if (!postmarkPayload.To || !postmarkPayload.TemplateAlias || !postmarkPayload.TemplateModel) {
      return res.status(400).send({ message: 'Invalid Postmark payload: Missing required fields' });
    }
    try {
      // Fetch Postmark API key from Firebase Realtime Database
      const snapshot = await apiKeysRef.once('value');
      const apiKeys = snapshot.val();
      if (!apiKeys || !apiKeys.POSTMARK_SERVER_KEY) {
        return res.status(500).send('Postmark API key not found');
      }
      const postmarkKey = apiKeys.POSTMARK_SERVER_KEY;
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

// // Firebase function to upload image to Cloudinary with transformations
// const cloudinary = require('cloudinary').v2;  // Cloudinary SDK
// exports.uploadImageToCloudinary = functions.https.onRequest(async (req, res) => {
//   cors(req, res, async () => {  // Apply CORS middleware here
//     try {
//       // Check that the request is a POST and contains an image
//       if (req.method !== 'POST') {
//         return res.status(405).send('Method Not Allowed');
//       }

//       if (!req.body || !req.body.image) {
//         return res.status(400).send('No image provided');
//       }

//       const imageBase64 = req.body.image; // Base64 image string sent in the body
//       const crop = req.body.crop || 'fill'; // Default crop method
//       const aspectRatio = req.body.aspectRatio || '1:1'; // Default aspect ratio
//       const rotate = req.body.rotate || 0; // Default rotation

//       // Fetch Cloudinary keys from Realtime Database
//       const snapshot = await apiKeysRef.once('value');
//       const apiKeys = snapshot.val();

//       if (!apiKeys || !apiKeys.Cloudinary_Name || !apiKeys.Cloudinary_Key || !apiKeys.Cloudinary_Secret) {
//         return res.status(500).send('Cloudinary configuration not found');
//       }

//       // Configure Cloudinary with the retrieved keys
//       cloudinary.config({
//         cloud_name: apiKeys.Cloudinary_Name,
//         api_key: apiKeys.Cloudinary_Key,
//         api_secret: apiKeys.Cloudinary_Secret,
//       });

//       // Build transformation options
//       let transformations = [];

//       // Add crop transformation
//       if (crop === 'fill') {
//         transformations.push('c_fill');
//       } else if (crop === 'fit') {
//         transformations.push('c_fit');
//       } else if (crop === 'pad') {
//         transformations.push('c_pad');
//       } else {
//         transformations.push('c_scale');  // Default: scale
//       }

//       // Add aspect ratio (width and height) transformation
//       const [width, height] = aspectRatio.split(':').map(Number);
//       transformations.push(`ar_${width}:${height}`);

//       // Add rotation transformation
//       if (rotate !== 0) {
//         transformations.push(`a_${rotate}`);
//       }

//       // Upload the image to Cloudinary with transformations
//       const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
//         folder: 'your-folder',  // Optional: Specify a folder in Cloudinary to store images
//         transformation: transformations.join(','),
//       });

//       // Send back the Cloudinary URL after successful upload
//       return res.status(200).json({ url: uploadResponse.secure_url });
//     } catch (error) {
//       console.error('Error uploading to Cloudinary:', error);
//       return res.status(500).send('Error uploading image');
//     }
//   });
// });