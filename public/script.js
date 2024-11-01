

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


async function startApp() {
  log('info', 'App Started');
  try {
    
    
 
		// Event listeners to handle form submissions
		
		document.getElementById('contact-form').addEventListener('submit', handleFormSubmit);

  } catch (error) {
    log('warn', 'App Start Failed');
    log('error', error);
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
	const phone = document.getElementById('phone').value;
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
		phone,
    carYear,
    carMake,
    carModel,
    carTrim,
    comments,
    timestamp: new Date().toISOString(),
  };
log('info', data);
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

async function sendPostmarkEmail(data) {
  const postmarkApiUrl = "https://api.postmarkapp.com/email"; // Removed trailing slash
  const postmarkApiKey = "7456c6b5-9905-4911-9eba-3db1a9f2b4b1"; // Replace with your Postmark server key
  const htmlTemplateUrl = 'https://fixthings.pro/customerSignupEmail.html'; // Ensure this URL is correct

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

  log('warn', emailBody); // Log email body content for debugging

  // Prepare the email payload
  const emailPayload = {
    From: "kyle@fixthings.pro", // Replace with your verified sender email
    To: `${data.email},kyle@fixthings.pro`, // Using test script format
    Subject: "Message Sent",
    HtmlBody: emailBody, // Use the escaped body directly
    MessageStream: "outbound"
  };

  try {
    const response = await fetch(postmarkApiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkApiKey
      },
      body: JSON.stringify(emailPayload) // Send the payload as a JSON string
    });

    // Detailed error handling for response
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Postmark response error:', errorData);
      throw new Error(`Failed to send confirmation email: ${errorData.Message || 'Unknown error'} (Status code: ${response.status})`);
    }

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    throw error;
  }
}

// Logging function

function log(type, message) {
  const allowedTypes = ['log', 'warn', 'error', 'info'];
  if (allowedTypes.includes(type)) {
    console[type](`[${new Date().toISOString()}] ${message}`);
  } else {
    console.log(`[${new Date().toISOString()}] Invalid log type: ${type}`);
  }
}

// Debugging function with button creation at the bottom of the script
(function() {
  // Function to auto-fill and submit the form with sample data
  function autoFillFormAndSubmit() {
    // Define sample data
    const sampleData = {
      name: "Kyle Fixit",
      email: "kyle@fixthings.pro",
      phone: "123-456-7890",
      carYear: "2014",
      carMake: "Chevy",
      carModel: "Cruze",
      carTrim: "Eco",
      comments: "Debugging form submission",
    };

    // Fill out the form fields with sample data
    document.getElementById('name').value = sampleData.name;
    document.getElementById('email').value = sampleData.email;
    document.getElementById('phone').value = sampleData.phone;
    document.getElementById('car-year').value = sampleData.carYear;
    document.getElementById('car-make').value = sampleData.carMake;
    document.getElementById('car-model').value = sampleData.carModel;
    document.getElementById('car-trim').value = sampleData.carTrim;
    document.getElementById('comments').value = sampleData.comments;

    // Log sample data for debugging
    log('info', 'Auto-filled form with sample data:', sampleData);

    // Submit the form
    document.getElementById('contact-form').dispatchEvent(new Event('submit'));
  }

  // Create a button to trigger the debugging function
  const debugButton = document.createElement('button');
  debugButton.textContent = "Auto-Fill Form and Submit";
  debugButton.style.position = "fixed";
  debugButton.style.bottom = "10px";
  debugButton.style.right = "10px";
  debugButton.onclick = autoFillFormAndSubmit;
  document.body.appendChild(debugButton);
})();