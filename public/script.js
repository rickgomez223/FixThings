const apiEndpoint = "https://vpic.nhtsa.dot.gov/api/vehicles/";

document.addEventListener('DOMContentLoaded', () => {
  log('info', 'DOMContentLoaded');
	loadDataFromLocal();
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
    document.getElementById('booking-form').addEventListener('submit', handleFormSubmit);
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

let retryInterval; // Variable to hold the retry interval ID

async function handleFormSubmit(event) {
  event.preventDefault();

  // Retrieve values from the form
  const firstName = document.getElementById('first-name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const vin = document.getElementById('vin').value;
  const vehicleType = document.getElementById('type').value;
  const year = document.getElementById('year').value;
  const make = document.getElementById('make').value;
  const model = document.getElementById('model').value;

  // Check if either VIN or vehicle information is provided
  if (!vin && !(vehicleType && year && make && model)) {
    alert('Please provide either the VIN or complete vehicle information.');
    return;
  }

  // Collect all data including new fields
  const data = {
    firstName: firstName || null,
    email: email || null,
    phone: phone || null,
    vin: vin || null,
    vehicleType: vehicleType || null,
    year: year || null,
    make: make || null,
    model: model || null,
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await sendToFirebase(data);
    if (result.success) {
      alert(`Form submitted successfully! Your ticket number is #${result.ticketNumber}`);
      document.getElementById('booking-form').reset(); // Reset the form on success
      localStorage.removeItem('formData'); // Clear saved data on successful submission
      clearInterval(retryInterval); // Clear any ongoing retry attempts
    }
  } catch (error) {
    console.error('Submission failed:', error);

    // Inform the user and save data locally
    alert('Submission failed. We will retry submitting the form. Your data has been saved locally.');
    saveDataLocally(data); // Save data to local storage

    // Start retrying the submission every 3 seconds
    retryInterval = setInterval(async () => {
      const savedData = loadDataFromLocal(); // Load the data to retry
      if (savedData) {
        try {
          const retryResult = await sendToFirebase(savedData); // Retry submission
          if (retryResult.success) {
            alert(`Retry successful! Your ticket number is #${retryResult.ticketNumber}`);
            document.getElementById('booking-form').reset(); // Reset the form after successful retry
            localStorage.removeItem('formData'); // Clear saved data on successful retry
            clearInterval(retryInterval); // Stop retrying
          }
        } catch (retryError) {
          console.error('Retry submission failed:', retryError);
          // You can add additional logging or user notifications here if needed
        }
      } else {
        alert('No previous data found for retry. Please try submitting the form again.');
        clearInterval(retryInterval); // Stop retrying if no data is found
      }
    }, 3000); // Retry every 3 seconds
  }
}

// Function to save data locally
function saveDataLocally(data) {
  localStorage.setItem('formData', JSON.stringify(data)); // Save as JSON string
  console.log('Form data saved locally:', data);
}

// Function to load data from local storage
function loadDataFromLocal() {
  const savedData = localStorage.getItem('formData');
  if (savedData) {
    const data = JSON.parse(savedData);
    
    // Pre-fill form fields with saved data
    document.getElementById('first-name').value = data.firstName || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('vin').value = data.vin || '';
    document.getElementById('type').value = data.vehicleType || '';
    document.getElementById('year').value = data.year || '';
    document.getElementById('make').value = data.make || '';
    document.getElementById('model').value = data.model || '';
    
    return data; // Return the data for retry check
  }
  return null; // Return null if no data found
}

// Function to send data to Firebase
async function sendToFirebase(data) {
  const functions = firebase.functions();
  const handleFormSubmission = functions.httpsCallable('handleFormSubmission');

  try {
    const response = await handleFormSubmission(data);
    return response.data; // Return the response data to be used in handleFormSubmit
  } catch (error) {
    console.error('Submission failed:', error);
    throw new Error('Failed to submit form.'); // Throw an error to be caught in handleFormSubmit
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