const admin = require('firebase-admin');

// Initialize Firebase Admin with your project
admin.initializeApp();

// Reference Firestore
const db = admin.firestore();

async function setupDatabase() {
  try {
    // Set up the initial ticket counter in the metadata collection
    const ticketCounterRef = db.collection('metadata').doc('ticketCounter');
    await ticketCounterRef.set({ currentTicket: 0 });
    console.log('Database setup complete. Initialized ticket counter to 0.');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase().then(() => process.exit());