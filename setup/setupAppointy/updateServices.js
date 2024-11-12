import { 
  app, database as db, databaseRef as ref, set, get, child, update, remove, auth, sendEmailVerification 
} from "../../public/src/firebase/FixThings-CustomerAppfirebaseConfig.js";

import axios from 'axios';

// Your SimplyBook.me API key

async function getSimplyBookApiKey() {
  const snapshot = await get(ref(db, 'apiKeys/SIMPLYBOOK_KEY'));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.error('No SimplyBook API key found.');
    throw new Error('API Key not found');
  }
}

// SimplyBook.me API URL to create services
const API_URL = 'https://user-api-v2.simplybook.me/admin/api/services';

// URL for your services JSON file
const servicesURL = 'https://fixthings.pro/src/services.json';

// Function to fetch the services from the URL
async function fetchServices() {
  try {
    const response = await axios.get(servicesURL);
    return response.data;
  } catch (error) {
    console.error('Error fetching services JSON:', error.message);
    throw error;
  }
}

// Function to create a service on SimplyBook.me
async function createSimplyBookService(service, simplyBook_key) {
  try {
    const response = await axios.post(API_URL, {
      service_name: service.name,
      description: service.description,
      price: service.price, // Price of the service
      duration: service.duration, // Duration in minutes
      staff_id: service.staff_id, // Staff ID for the service
      service_type: service.type, // Type of service (e.g., in-person, online)
      expenses: service.expenses // You can include expenses here if needed
    }, {
      headers: {
        'Authorization': `Bearer ${simplyBook_key}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Service created on SimplyBook.me: ${service.name}`);
  } catch (error) {
    console.error(`Error creating service for ${service.name}:`, error.response ? error.response.data : error.message);
  }
}

async function main() {
  try {
    // Get SimplyBook API Key
    const simplyBook_key = await getSimplyBookApiKey();

    // Fetch services from JSON URL
    const services = await fetchServices();

    // Loop through the services and create services on SimplyBook.me
    for (const service of services) {
      await createSimplyBookService(service, simplyBook_key);
    }

  } catch (error) {
    console.error('Error in the main function:', error.message);
  }
}

main();