import { 
  app, database as db, databaseRef as ref, set, get, child, update, remove, auth, sendEmailVerification 
} from "../../public/src/firebase/FixThings-CustomerAppfirebaseConfig.js";

const axios = require('axios');
const fs = require('fs');

// Your SimplyBook.me API key

const simplyBook_key = await get(ref(db, 'apiKeys/SIMPLYBOOK_KEY'));

// SimplyBook.me API URL to create services
const API_URL = 'https://user-api-v2.simplybook.me/admin/api/services';

// URL for your services JSON file
const servicesURL = 'https://fixthings.pro/src/services.json';

// Read the services from services.json
const services = JSON.parse(fs.readFileSync(servicesURL, 'utf-8'));

// Function to create a service on SimplyBook.me
async function createSimplyBookService(service) {
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

// Loop through the services and create services on SimplyBook.me
services.forEach(async (service) => {
  await createSimplyBookService(service);
});