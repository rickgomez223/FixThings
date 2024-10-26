const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

exports.handleFormSubmission = functions.https.onCall(async (data, context) => {
  const { vin, vehicleType, year, make, model, timestamp } = data;

  try {
    // Step 1: Get and increment the current ticket number
    const ticketRef = db.collection('metadata').doc('ticketCounter');
    const ticketDoc = await ticketRef.get();
    
    let ticketNumber;
    if (ticketDoc.exists) {
      ticketNumber = ticketDoc.data().currentTicket + 1;
      await ticketRef.update({ currentTicket: ticketNumber });
    } else {
      // Initialize if first time
      ticketNumber = 1;
      await ticketRef.set({ currentTicket: ticketNumber });
    }

    // Step 2: Save submission with ticket number
    const entryRef = await db.collection('submissions').add({
      vin,
      vehicleType,
      year,
      make,
      model,
      timestamp,
      ticketNumber, // Save the ticket number with the submission
    });

    // Step 3: Send data to Pushcut with the ticket number
    const pushcutUrl = 'https://api.pushcut.io/<YOUR_PUSH_CUT_ENDPOINT>';
    const pushcutData = {
      title: 'New Vehicle Submission',
      text: `Ticket #${ticketNumber} - VIN: ${vin || 'N/A'}, Type: ${vehicleType || 'N/A'}, Year: ${year || 'N/A'}, Make: ${make || 'N/A'}, Model: ${model || 'N/A'}`,
    };

    const response = await fetch(pushcutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushcutData),
    });

    if (!response.ok) throw new Error(`Pushcut response status: ${response.status}`);

    // Return the ticket number to the client
    return { success: true, ticketNumber: ticketNumber };
  } catch (error) {
    console.error('Error in handleFormSubmission:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle form submission');
  }
});