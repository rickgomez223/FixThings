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

  // Define the contact form
  const form = event.target;

  // Retrieve values from the contact form
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const carYear = document.getElementById('car-year').value;
  const carMake = document.getElementById('car-make').value;
  const carModel = document.getElementById('car-model').value;
  const carTrim = document.getElementById('car-trim').value;
  const comments = document.getElementById('comments').value;

  // Validation: Ensure all required fields are provided
  if (!(name && email && carYear && carMake && carModel && carTrim)) {
    alert('Please provide your name, email & the complete vehicle information.');
    return;
  }

  // Collect contact form data into an object
  const data = {
    name,
    email,
    carYear,
    carMake,
    carModel,
    carTrim,
    comments,
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Get customer count and assign unique ticket number
    const ticketNumber = await incrementCustomerCount();
    data.ticketNumber = ticketNumber; // Assign the unique ticket number

    // Step 2: Save customer info to Firebase
    await saveCustomerToFirebase(data);

    // Step 3: Send webhook to Pushcut
    await sendPushcutWebhook(data);

    // Step 4: Send confirmation email via Postmark
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
    const snapshot = await get(customerCountRef);

    let newCount;
    if (!snapshot.exists()) {
      newCount = 1;
      await set(customerCountRef, { count: newCount });
    } else {
      const currentCount = snapshot.val().count;
      newCount = currentCount + 1;
      await set(customerCountRef, { count: newCount });
    }

    return newCount;
  } catch (error) {
    console.error('Error incrementing customer count:', error.message || error);
    throw new Error('Failed to generate ticket number.');
  }
}

// Step 2: Save customer data to Firebase
async function saveCustomerToFirebase(data) {
  try {
    const customerRef = ref(db, 'customers/' + data.ticketNumber);
    await set(customerRef, data);
  } catch (error) {
    console.error('Error saving customer data to Firebase:', error);
    throw new Error('Failed to save customer data.');
  }
}

// Step 3: Send Pushcut webhook
async function sendPushcutWebhook(data) {
  try {
    const webhookUrl = 'https://api.pushcut.io/VEQktvCTFnpchKTT3TsIK/notifications/FWA';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification: 'New Booking Submitted',
        title: 'New Booking',
        text: `Ticket #${data.ticketNumber}: ${data.name} submitted a form.`,
      }),
    });

    if (!response.ok) throw new Error('Failed to send Pushcut webhook');
  } catch (error) {
    console.error('Error sending Pushcut webhook:', error);
    throw new Error('Failed to notify Pushcut.');
  }
}

async function sendPostmarkEmail(data) {
  const postmarkApiUrl = "https://api.postmarkapp.com/email";
  const postmarkApiKey = "7456c6b5-9905-4911-9eba-3db1a9f2b4b1"; // Replace with your Postmark server key
  const htmlTemplateUrl = './customerSignupEmail.html'; // URL to your hosted HTML template

  let emailBody;

  // Fetch the HTML body from the hosted URL
  try {
    const response = await fetch(htmlTemplateUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML template: ${response.status} ${response.statusText}`);
    }
    emailBody = await response.text(); // Get the HTML content as text
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }

  // Replace placeholders with actual values
  emailBody = emailBody
    .replace(/{{name}}/g, data.name || 'Customer')
    .replace(/{{ticketNumber}}/g, data.ticketNumber || 'N/A')
    .replace(/{{phone}}/g, data.phone || 'N/A')
    .replace(/{{carYear}}/g, data.carYear || 'N/A')
    .replace(/{{carMake}}/g, data.carMake || 'N/A')
    .replace(/{{carModel}}/g, data.carModel || 'N/A')
    .replace(/{{carTrim}}/g, data.carTrim || 'N/A')
    .replace(/{{comments}}/g, data.comments || 'N/A');

		log('warn', emailBody);
  try {
    const response = await fetch(postmarkApiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkApiKey
      },
      body: JSON.stringify({
        From: "kyle@fixthings.pro", // Replace with your verified sender email
        To: `${data.email},kyle@fixthings.pro`,
        Subject: "Submission Received",
        HtmlBody: emailBody,
        MessageStream: "outbound"
      })
    });

    // Detailed error handling for response
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Postmark response error:', errorData);
      throw new Error(`Failed to send confirmation email: ${errorData.Message || 'Unknown error'}`);
    }

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message || error);
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