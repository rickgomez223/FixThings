//
// Logging Function
//
function log(type, message) {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${type.toUpperCase()}: ${message}`);
}

//
// Auto Start App
//
document.addEventListener('DOMContentLoaded', () => {
  log('info', 'DOMContentLoaded event triggered');
  try {
    log('info', 'Calling Start App');
    preApp();
  } catch (error) {
    log('error', 'Call to Start App Failed');
    log('error', error.message);
  }
});

//
// Pre App Logic (hold UI until everything loads)
//
function preApp() {
  log('info', 'PreApp Started');
  try {
    loadServicesJSON();
    loadAboutMeText();
    loadCarousel();
    loadPricingText();

    log('info', 'PreApp successfully loaded, calling main app');
    app(); // Proceed to main app logic
  } catch (error) {
    log('warn', 'PreApp Failed');
    log('error', error.message);
  }
}

//
// Load Services JSON
//
function loadServicesJSON() {
  log('info', 'Fetching services JSON...');
  const servicesList = document.getElementById('services-list');
  const pricingTable = document.getElementById('pricing-table');

  fetch('./src/services.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load services.json: ' + response.statusText);
      log('info', 'Services JSON successfully fetched');
      return response.json();
    })
    .then(services => {
      services.forEach(service => {
        log('info', `Processing service: ${service.name}`);
        
        // Populate Services List
        const listItem = document.createElement('li');
        listItem.textContent = service.name;
        listItem.classList.add('service-item');
        servicesList.appendChild(listItem);

        // Create Table Row With Service Data
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
          <td><a href="#">${service.name}</a></td>
          <td>$${service.price.replace('$', '')}</td>
          <td>${service.description}</td>
        `;
        pricingTable.querySelector('tbody').appendChild(tableRow);

        // Add Event Listener for Service Link (Popup)
        tableRow.querySelector('a').addEventListener('click', (event) => {
          event.preventDefault();
          log('info', `Service clicked: ${service.name}`);
          showServicePopup(service);
        });
      });
    })
    .catch(error => {
      log('error', 'Failed to fetch services JSON');
      log('error', error.message);
    });
}

//
// Show Service Popup
//
function showServicePopup(service) {
  log('info', `Showing popup for service: ${service.name}`);
  const popup = document.getElementById('service-details-popup');
  popup.querySelector('h2').textContent = service.name;
  popup.querySelector('p:nth-child(3)').textContent = service.description;

  const expenseList = popup.querySelector('ul');
  expenseList.innerHTML = '';
  service.expenses.forEach(expense => {
    log('info', `Adding expense: ${expense.name}, cost: ${expense.cost}`);
    const expenseItem = document.createElement('li');
    expenseItem.textContent = `${expense.name}: $${expense.cost}`;
    expenseList.appendChild(expenseItem);
  });

  popup.classList.remove('hidden');
  popup.querySelector('.close-button').addEventListener('click', () => {
    log('info', `Closing popup for service: ${service.name}`);
    popup.classList.add('hidden');
  });

  document.addEventListener('click', (event) => {
    if (event.target !== popup && !popup.contains(event.target)) {
      log('info', 'Popup closed by clicking outside');
      popup.classList.add('hidden');
    }
  });
}

//
// Load About Me Text
//
function loadAboutMeText() {
  log('info', 'Fetching aboutMe.txt...');
  const aboutMeTxt = document.getElementById('aboutMeTxt');

  fetch('./src/aboutMe.txt')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load aboutMe.txt: ' + response.statusText);
      log('info', 'aboutMe.txt successfully fetched');
      return response.text();
    })
    .then(data => {
      aboutMeTxt.textContent = data;
    })
    .catch(error => {
      log('error', 'Failed to fetch aboutMe.txt');
      log('error', error.message);
    });
}

//
// Load Carousel
//
function loadCarousel() {
  log('info', 'Setting up carousel...');
  const carouselSlide = document.querySelector('.carousel-slide');
  const carouselImages = document.querySelectorAll('.carousel-slide img');
  let counter = 0;
  const size = carouselImages[0].clientWidth;

  carouselSlide.style.transform = `translateX(${-size * counter}px)`;

  setInterval(() => {
    moveToNextImage();
  }, 3000);

  function moveToNextImage() {
    if (counter >= carouselImages.length - 1) counter = -1;
    log('info', `Moving to next carousel image, counter: ${counter}`);
    carouselSlide.style.transition = 'transform 0.4s ease-in-out';
    counter++;
    carouselSlide.style.transform = `translateX(${-size * counter}px)`;
  }
}

//
// Load Pricing Text
//
function loadPricingText() {
  log('info', 'Fetching pricing.txt...');
  const pricingTxt = document.getElementById('pricingTxt');

  fetch('./src/pricing.txt')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load pricing.txt: ' + response.statusText);
      log('info', 'pricing.txt successfully fetched');
      return response.text();
    })
    .then(data => {
      pricingTxt.textContent = data;
    })
    .catch(error => {
      log('error', 'Failed to fetch pricing.txt');
      log('error', error.message);
    });
}

//
// Main App Logic
//
function app() {
  log('info', 'App Started');
  try {
    
    setupContactForm();
  } catch (error) {
    log('error', 'App Failed');
    log('error', error.message);
  }
}

//
// Contact Form Logic
//
const apiEndpoint = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetAllModelsForMakeYear/';

async function getYears() {
  log('info', 'Fetching vehicle years...');
  try {
    const response = await fetch(`${apiEndpoint}?format=json&year=2023&make=Ford`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    log('info', 'Years fetched successfully');
    return data.Results;
  } catch (error) {
    log('error', 'Error fetching vehicle years');
    log('error', error.message);
  }
}

async function fetchYears() {
  log('info', 'Populating year dropdown...');
  const years = await getYears();
  const yearDropdown = document.getElementById('year');
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
  });
}

async function fetchMakes() {
  log('info', 'Fetching vehicle makes...');
  const selectedYear = document.getElementById('year').value;
  const makeDropdown = document.getElementById('make');
  makeDropdown.innerHTML = '<option value="">Select Make</option>';

  try {
    const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    log('info', `Makes fetched for year ${selectedYear}`);
    const makes = data.Results;
    makes.forEach(make => {
      const option = document.createElement('option');
      option.value = make;
      option.text = make;
      makeDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', `Error fetching makes for year ${selectedYear}`);
    log('error', error.message);
  }
}

async function fetchModels() {
  log('info', 'Fetching vehicle models...');
  const selectedYear = document.getElementById('year').value;
  const selectedMake = document.getElementById('make').value;
  const modelDropdown = document.getElementById('model');
  modelDropdown.innerHTML = '<option value="">Select Model</option>';

  try {
    const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}&make=${selectedMake}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    log('info', `Models fetched for make ${selectedMake}`);
    const models = data.Results;
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.text = model;
      modelDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', `Error fetching models for make ${selectedMake}`);
    log('error', error.message);
  }
}

async function fetchSubmodels() {
  log('info', 'Fetching vehicle submodels...');
  const selectedYear = document.getElementById('year').value;
  const selectedMake = document.getElementById('make').value;
  const selectedModel = document.getElementById('model').value;
  const submodelDropdown = document.getElementById('submodel');
  submodelDropdown.innerHTML = '<option value="">Select Sub-Model</option>';

  try {
    const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}&make=${selectedMake}&model=${selectedModel}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    log('info', `Submodels fetched for model ${selectedModel}`);
    const submodels = data.Results;
    submodels.forEach(submodel => {
      const option = document.createElement('option');
      option.value = submodel;
      option.text = submodel;
      submodelDropdown.appendChild(option);
    });
  } catch (error) {
    log('error', `Error fetching submodels for model ${selectedModel}`);
    log('error', error.message);
  }
}

//
// Contact Form Setup
//
function setupContactForm() {
  log('info', 'Setting up contact form...');
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    log('info', 'Contact form submitted');
    await fetchYears();
    await fetchMakes();
    await fetchModels();
    await fetchSubmodels();
    log('info', 'Contact form processing complete');
  });
}