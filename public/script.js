const apiEndpoint = "https://vpic.nhtsa.dot.gov/api/vehicles/";

// Your main JS file

import { app, database as db, ref, set, get, child, update } from './src/firebase/FixThings-CustomerAppfirebaseConfig.js';


document.addEventListener('DOMContentLoaded', () => {
  log('info', 'DOMContentLoaded');
	
  initializeApp();
});

async function initializeApp() {
  log('info', 'App Initialization Started');
  try {
    await loadServices(); // Includes populateServicesDropdown
    await loadAboutMe();
    await loadCarousel();
    await loadPricingText();
    populateYearsDropdown(); // Only call this once here
    startApp();
  } catch (error) {
    log('warn', 'App Initialization Failed');
    log('error', error);
  }
}

async function loadServices() {
  try {
    const servicesList = document.getElementById('services-list');
    const pricingTable = document.getElementById('pricing-table');
    const response = await fetch('./src/services.json');
    if (!response.ok) throw new Error(`Failed to load services.json: ${response.statusText}`);

    const services = await response.json();
    services.forEach(service => {
      appendServiceToList(servicesList, service);
      appendServiceToPricingTable(pricingTable, service);
			
    });
		populateServicesDropdown();
  } catch (error) {
    log('error', 'Failed to load services JSON');
    log('error', error);
  }
}

function appendServiceToList(servicesList, service) {
  const listItem = document.createElement('li');
  listItem.textContent = service.name;
  listItem.classList.add('service-item');
  servicesList.appendChild(listItem);
}

function appendServiceToPricingTable(pricingTable, service) {
  const tableRow = document.createElement('tr');

  const serviceNameCell = document.createElement('td');
  const serviceLink = document.createElement('a');
  serviceLink.href = '#';
  serviceLink.textContent = service.name;
  serviceNameCell.appendChild(serviceLink);

  const priceCell = document.createElement('td');
  priceCell.textContent = `$${service.price.replace('$', '')}`;

  const descriptionCell = document.createElement('td');
  descriptionCell.textContent = service.description;

  tableRow.append(serviceNameCell, priceCell, descriptionCell);
  pricingTable.querySelector('tbody').appendChild(tableRow);

  serviceLink.addEventListener('click', event => showServicePopup(event, service));
}

function showServicePopup(event, service) {
  event.preventDefault();
  const popup = document.getElementById('service-details-popup');
  popup.querySelector('h2').textContent = service.name;
  popup.querySelector('p:nth-child(3)').textContent = service.description;

  const expenseList = popup.querySelector('ul');
  expenseList.innerHTML = '';
  service.expenses.forEach(expense => {
    const expenseItem = document.createElement('li');
    expenseItem.textContent = `${expense.name}: $${expense.cost}`;
    expenseList.appendChild(expenseItem);
  });

  popup.classList.remove('hidden');
  document.addEventListener('click', event => {
    if (!popup.contains(event.target)) popup.classList.add('hidden');
  });
}

async function loadAboutMe() {
  try {
    const aboutMeTxt = document.getElementById('aboutMeTxt');
    const response = await fetch('./src/aboutMe.txt');
    if (!response.ok) throw new Error(`Failed to load aboutMe.txt: ${response.statusText}`);
    aboutMeTxt.textContent = await response.text();
  } catch (error) {
    log('error', 'Failed to load aboutMe.txt');
    log('error', error);
  }
}

async function loadCarousel() {
  try {
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselImages = document.querySelectorAll('.carousel-slide img');
    let counter = 0;
    const size = carouselImages[0].clientWidth;

    setInterval(() => {
      counter = (counter >= carouselImages.length - 1) ? -1 : counter;
      carouselSlide.style.transition = "transform 0.4s ease-in-out";
      carouselSlide.style.transform = `translateX(${-size * ++counter}px)`;
    }, 3000);
  } catch (error) {
    log('error', 'Failed to load carousel');
    log('error', error);
  }
}

async function loadPricingText() {
  try {
    const pricingTxt = document.getElementById('pricingTxt');
    const response = await fetch('./src/pricing.txt');
    if (!response.ok) throw new Error(`Failed to load pricing.txt: ${response.statusText}`);
    pricingTxt.textContent = await response.text();
  } catch (error) {
    log('error', 'Failed to load pricing.txt');
    log('error', error);
  }
}

function populateYearsDropdown() {
  const yearDropdown = document.getElementById('year');
  const currentYear = new Date().getFullYear();

  yearDropdown.innerHTML = '<option value="">Select Year</option>';
  for (let year = currentYear; year >= 1980; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
  }
}

function populateServicesDropdown() {
  try {
    const serviceDropdown = document.getElementById('service');
    const servicesList = document.getElementById('services-list');
    servicesList.querySelectorAll('li').forEach(item => {
      const option = document.createElement('option');
      option.value = item.textContent;
      option.text = item.textContent;
      serviceDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', 'Failed to populate services dropdown');
    log('error', error);
  }
}

async function startApp() {
  log('info', 'App Started');
  try {
    
    document.getElementById('type').addEventListener('change', fetchMakes);
    document.getElementById('year').addEventListener('change', fetchModels);
    document.getElementById('make').addEventListener('change', fetchModels);
 
		// Event listeners to handle form submissions
		document.getElementById('booking-form').addEventListener('submit', handleFormSubmit);
		document.querySelector('.contact-form form').addEventListener('submit', handleFormSubmit);

  } catch (error) {
    log('warn', 'App Start Failed');
    log('error', error);
  }
}

async function fetchMakes() {
  const makeDropdown = document.getElementById("make");
  makeDropdown.innerHTML = '<option value="">Select Make</option>';
  const uiType = document.getElementById('type').value;
  if (!uiType) return log('warn', 'Please select a type of vehicle.');

  try {
    const response = await fetch(`${apiEndpoint}GetMakesForVehicleType/${uiType}?format=json`);
    if (!response.ok) throw new Error(`Failed to fetch makes: ${response.statusText}`);

    const makes = await response.json();
    makes.Results.forEach(make => {
      const option = document.createElement("option");
      option.value = make.MakeId;
      option.text = make.MakeName;
      makeDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', `Error fetching makes: ${error.message}`);
  }
}

async function fetchModels() {
  const modelDropdown = document.getElementById("model");
  modelDropdown.innerHTML = '<option value="">Select Model</option>';
  const uiYear = document.getElementById('year').value;
  const uiMakeId = document.getElementById('make').value;
  const uiType = document.getElementById('type').value;
  if (!uiYear || !uiMakeId) return log('warn', 'Please select both a year and a make to fetch models.');

  try {
    const response = await fetch(`${apiEndpoint}GetModelsForMakeIdYear/makeId/${uiMakeId}/modelyear/${uiYear}/vehicletype/${uiType}?format=json`);
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);

    const models = await response.json();
    if (models.Count === 0) return log('info', `No models found for make ID ${uiMakeId} in ${uiYear}.`);

    models.Results.forEach(model => {
      const option = document.createElement("option");
      option.value = model.Model_ID;
      option.text = model.Model_Name;
      modelDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', `Error fetching models: ${error.message}`);
  }
}

// Main form submission handler
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Determine which form is being submitted
  const form = event.target;
  const formType = form.id === 'booking-form' ? 'booking' : 'contact';

  let data;

  if (formType === 'contact') {
    // Retrieve values from the contact form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const carYear = document.getElementById('car-year').value;
    const carMake = document.getElementById('car-make').value;
    const carModel = document.getElementById('car-model').value;
    const carTrim = document.getElementById('car-trim').value;
    const comments = document.getElementById('comments').value;

    // Collect contact form data into an object
    data = {
      name,
      email,
      carYear,
      carMake,
      carModel,
      carTrim,
      comments,
      timestamp: new Date().toISOString(),
    };

  } else if (formType === 'booking') {
    // Retrieve values from the booking form
    const firstName = document.getElementById('first-name').value;
    const email = document.getElementById('email').value; // You might want to change the email field ID to avoid confusion
    const phone = document.getElementById('phone').value;
    const vin = document.getElementById('vin').value;
    const vehicleType = document.getElementById('type').value;
    const year = document.getElementById('year').value;
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const submodel = document.getElementById('submodel').value; // For car trim
    const service = document.getElementById('service').value;
    const comments = document.getElementById('comments').value;

    // Validation: Ensure either VIN or full vehicle information is provided
    if (!vin && !(vehicleType && year && make && model)) {
      alert('Please provide either the VIN or complete vehicle information.');
      return;
    }

    // Collect booking form data into an object
    data = {
      firstName,
      email,
      phone,
      vin,
      vehicleType,
      year,
      make,
      model,
      submodel,
      service,
      comments,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Step 1: Get customer count and assign unique ticket number
    const ticketNumber = await incrementCustomerCount();
    data.ticketNumber = ticketNumber; // Assign the unique ticket number

    // Step 2: Save customer info to Firebase
    await saveCustomerToFirebase(data);

    // Step 3: Send webhook to Pushcut
    await sendPushcutWebhook(data);

    // Step 4: Send confirmation email via Mailgun
    await sendPostmarkEmail(data);

    // Notify user of success
    alert(`Form submitted successfully! Your ticket number is #${ticketNumber}`);
    form.reset(); // Reset the form after submission
  } catch (error) {
    console.error('Submission failed:', error);
    alert('There was an issue with submission. Please try again later.');
  }
}

// Step 1: Increment customer count and return the new count
async function incrementCustomerCount() {
  try {
    const customerCountRef = ref(db, 'meta/customerCount');
    console.log('Reference to customer count:', customerCountRef);

    // Attempt to get the current count from the database
    const snapshot = await get(customerCountRef);
    console.log('Snapshot exists:', snapshot.exists());

    let newCount;

    if (!snapshot.exists()) {
      // If no count exists, initialize it to 1
      newCount = 1;
      console.log('No existing count found. Initializing customer count to:', newCount);
      await set(customerCountRef, { count: newCount });
      console.log('Customer count initialized in database.');
    } else {
      // If it exists, increment the current count
      const currentCount = snapshot.val().count; // Get current count value
      console.log('Current count retrieved:', currentCount);
      
      newCount = currentCount + 1; // Increment the count
      console.log('Incrementing count to:', newCount);
      
      // Set the updated count back to the database
      await set(customerCountRef, { count: newCount });
      console.log('Customer count updated in database.');
    }

    // Return the new count as the ticket number
    console.log('Returning new count as ticket number:', newCount);
    return newCount; 
  } catch (error) {
    console.error('Error incrementing customer count:', error.message || error);
    throw new Error('Failed to generate ticket number.');
  }
}

// Step 2: Save customer data to Firebase
async function saveCustomerToFirebase(data) {
  try {
    const customerRef = ref(db, 'customers/' + data.ticketNumber); // Using ticket number as the key
    await set(customerRef, data); // Save data
    console.log('Customer data saved to Firebase:', data);
  } catch (error) {
    console.error('Error saving customer data to Firebase:', error);
    throw new Error('Failed to save customer data.');
  }
}

// Step 3: Send Pushcut webhook
async function sendPushcutWebhook(data) {
  try {
    const webhookUrl = 'https://api.pushcut.io/VEQktvCTFnpchKTT3TsIK/notifications/FWA'; // Replace with your Pushcut webhook URL
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification: 'New Booking Submitted',
        title: 'New Booking',
        message: `Ticket #${data.ticketNumber}: ${data.firstName || data.name} submitted a form.`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send Pushcut webhook');
    }

    console.log('Pushcut webhook sent successfully.');
  } catch (error) {
    console.error('Error sending Pushcut webhook:', error);
    throw new Error('Failed to notify Pushcut.');
  }
}

async function sendPostmarkEmail(data) {
  const postmarkApiUrl = "https://api.postmarkapp.com/email";
  const postmarkApiKey = "7456c6b5-9905-4911-9eba-3db1a9f2b4b1"; // Replace with your Postmark server key

  // Construct email body with fallbacks for blank fields
  const emailBody = `
    Hello ${data.firstName || data.name || 'N/A'},
    Thank you for your submission. Your ticket number is #${data.ticketNumber || 'N/A'}.
    We will get in touch with you soon!

    Details:
    - Phone: ${data.phone || 'N/A'}
    - Vehicle: ${data.year || 'N/A'} ${data.make || 'N/A'} ${data.model || 'N/A'} (${data.vin || 'N/A'})
    - Trim: ${data.submodel || 'N/A'}

    Best regards,
    Your Team
  `;

  try {
    log('info', 'Preparing to send email to: ' + (data.email || 'N/A'));

    const response = await fetch(postmarkApiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkApiKey
      },
      body: JSON.stringify({
        From: "kyle@fixthings.pro", // Replace with your verified sender email
        To: "kyle@fixthings.pro", // Change to the recipient's email
        Subject: "Hello from Postmark",
        HtmlBody: emailBody,
        MessageStream: "outbound"
      })
    });

    // Handle response and check for errors
    if (!response.ok) {
      const error = await response.json();
      log('error', 'Error sending email via Postmark', error);
      throw new Error('Failed to send confirmation email.');
    }

    const responseData = await response.json();
    log('info', 'Postmark email sent successfully', responseData);
  } catch (error) {
    log('error', 'Error sending email', error);
    throw error;
  }
}

function log(type, message) {
  const allowedTypes = ['log', 'warn', 'error', 'info'];
  if (allowedTypes.includes(type)) {
    console[type](`[${new Date().toISOString()}] ${message}`);
  } else {
    console.log(`[${new Date().toISOString()}] Invalid log type: ${type}`);
  }
}