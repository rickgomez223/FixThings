const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

exports.handleFormSubmission = functions.https.onCall(async (data, context) => {
  const { vin, vehicleType, year, make, model, timestamp } = data;

  // Save to Firestore
  const entryRef = db.collection('submissions').add({
    vin,
    vehicleType,
    year,
    make,
    model,
    timestamp,
  });

  // Prepare webhook content for Pushcut
  const pushcutUrl = 'https://api.pushcut.io/<YOUR_PUSH_CUT_ENDPOINT>'; // Replace with your Pushcut URL
  const pushcutData = {
    title: 'New Vehicle Submission',
    text: `VIN: ${vin || 'N/A'}, Type: ${vehicleType || 'N/A'}, Year: ${year || 'N/A'}, Make: ${make || 'N/A'}, Model: ${model || 'N/A'}`,
  };

  try {
    const response = await fetch(pushcutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushcutData),
    });

    if (!response.ok) {
      throw new Error(`Pushcut response status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending webhook to Pushcut:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send webhook to Pushcut');
  }
});