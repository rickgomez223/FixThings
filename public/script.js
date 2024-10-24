const apiEndpoint = "https://vpic.nhtsa.dot.gov/api/vehicles/";

document.addEventListener('DOMContentLoaded', () => {
  log('info', 'DOMContentLoaded');
  preApp();
});

async function preApp() {
  log('info', 'PreApp Started');
  try {
    await loadServices();
    await loadAboutMe();
    await loadCarousel();
    await loadPricingText();
    populateYearsDropdown();
    fetchServices();
    app();
  } catch (error) {
    log('warn', 'PreApp Failed');
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
  priceCell.textContent = '$' + service.price.replace('$', '');

  const descriptionCell = document.createElement('td');
  descriptionCell.textContent = service.description;

  tableRow.appendChild(serviceNameCell);
  tableRow.appendChild(priceCell);
  tableRow.appendChild(descriptionCell);
  pricingTable.querySelector('tbody').appendChild(tableRow);

  serviceLink.addEventListener('click', (event) => {
    showServicePopup(event, service);
  });
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
  popup.querySelector('.close-button').addEventListener('click', () => {
    popup.classList.add('hidden');
  });
  document.addEventListener('click', (e) => {
    if (e.target !== popup && !popup.contains(e.target)) {
      popup.classList.add('hidden');
    }
  });
}

async function loadAboutMe() {
  try {
    const aboutMeTxt = document.getElementById('aboutMeTxt');
    const response = await fetch('./src/aboutMe.txt');
    if (!response.ok) throw new Error(`Failed to load aboutMe.txt: ${response.statusText}`);
    const data = await response.text();
    aboutMeTxt.textContent = data;
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
    carouselSlide.style.transform = `translateX(${-size * counter}px)`;

    setInterval(() => {
      counter = (counter >= carouselImages.length - 1) ? -1 : counter;
      carouselSlide.style.transition = "transform 0.4s ease-in-out";
      counter++;
      carouselSlide.style.transform = `translateX(${-size * counter}px)`;
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
    const data = await response.text();
    pricingTxt.textContent = data;
  } catch (error) {
    log('error', 'Failed to load pricing.txt');
    log('error', error);
  }
}

function fetchServices() {
  try {
    const serviceDropdown = document.getElementById('service');
    const servicesList = document.getElementById('services-list');
    const serviceItems = servicesList.querySelectorAll('li');

    serviceItems.forEach(item => {
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

async function app() {
  log('info', 'App Started');
  try {
    const selectedYear = document.getElementById("year").value;
    await fetchMakes(selectedYear);
    // Additional logic for fetching models and submodels would follow
  } catch (error) {
    log('warn', 'App Failed');
    log('error', error);
  }
}
function populateYearsDropdown() {
  const yearDropdown = document.getElementById("year");
  const currentYear = new Date().getFullYear();

  for (let year = 1990; year <= currentYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
  }
}

async function fetchMakes() {
  const makeDropdown = document.getElementById("make");
  makeDropdown.innerHTML = '<option value="">Select Make</option>'; // Reset dropdown
  try {
    const response = await fetch(`${apiEndpoint}GetMakesForVehicleType/car?format=json`);
    if (!response.ok) throw new Error(`Failed to fetch makes: ${response.statusText}`);

    const makes = await response.json();
    
    makes.Results.forEach(make => {
      const option = document.createElement("option");
      option.value = make.MakeId; // Use MakeId for value
      option.text = make.MakeName; // Use MakeName for display text
      makeDropdown.appendChild(option);
    });
    
    log('info', `Makes fetched successfully`);
  } catch (error) {
    log('error', `Error fetching makes: ${error.message}`);
  }
}

async function fetchModels() {
  const modelDropdown = document.getElementById("model");
  modelDropdown.innerHTML = '<option value="">Select Model</option>'; // Reset dropdown

  // Get user-selected values for year and make
  const uiYear = document.getElementById('year').value;
  const uiMake = document.getElementById('make').value;

  if (!uiYear || !uiMake) {
    log('warn', 'Please select both a year and a make to fetch models.');
    return; // Exit if year or make is not selected
  }

  try {
    const response = await fetch(`${apiEndpoint}GetModelsForMakeYear/make/${uiMake}/modelyear/${uiYear}?format=json`);
    
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);

    const models = await response.json();

    // Log the full response for debugging
    log('info', 'Models response:', models);

    if (models.Count === 0) {
      log('info', `No models found for make ID ${uiMake} in ${uiYear}.`);
      return; // No models to display
    }

    models.Results.forEach(model => {
      const option = document.createElement("option");
      option.value = model.ModelId; // Use ModelId for value
      option.text = model.ModelName; // Use ModelName for display text
      modelDropdown.appendChild(option);
    });

    log('info', `Models fetched successfully for ${uiMake} in ${uiYear}`);
  } catch (error) {
    log('error', `Error fetching models: ${error.message}`);
  }
}

// Example event listeners for when the user selects a year or make
document.getElementById('year').addEventListener('change', fetchModels);
document.getElementById('make').addEventListener('change', fetchModels);





function log(type, message) {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${message}`);
}