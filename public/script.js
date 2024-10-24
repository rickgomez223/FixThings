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
    populateYears(); // Populate years on app start
    const selectedYear = document.getElementById("year").value;
    await fetchMakes(selectedYear);
  } catch (error) {
    log('warn', 'App Failed');
    log('error', error);
  }
}

function populateYears() {
  const yearDropdown = document.getElementById('year');
  const currentYear = new Date().getFullYear();
  
  yearDropdown.innerHTML = '<option value="">Select Year</option>'; // Reset dropdown

  for (let year = currentYear; year >= 1980; year--) { // Adjust the range as necessary
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
  }
}

async function fetchMakes() {
  const makeDropdown = document.getElementById("make");
  makeDropdown.innerHTML = '<option value="">Select Make</option>'; // Reset dropdown
  const uiType = document.getElementById('type').value;

  if (!uiType) {
    log('warn', 'Please select a type of vehicle.');
    return; 
  }

  try {
    const response = await fetch(`${apiEndpoint}GetMakesForVehicleType/${uiType}?format=json`);
    if (!response.ok) throw new Error(`Failed to fetch makes: ${response.statusText}`);

    const makes = await response.json();
    makes.Results.forEach(make => {
      const option = document.createElement("option");
      option.value = make.MakeId; // Use MakeId for value (NHTSA)
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

  const uiYear = document.getElementById('year').value;
  const uiMakeId = document.getElementById('make').value; // Using MakeId for NHTSA
  const uiType = document.getElementById('type').value;

  if (!uiYear || !uiMakeId) {
    log('warn', 'Please select both a year and a make to fetch models.');
    return; // Exit if year or make is not selected
  }

  try {
    const response = await fetch(`${apiEndpoint}GetModelsForMakeIdYear/makeId/${uiMakeId}/modelyear/${uiYear}/vehicletype/${uiType}?format=json`);
    
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);

    const models = await response.json();
    if (!models.Results || models.Count === 0) {
      log('info', `No models found for make ID ${uiMakeId} in ${uiYear}.`);
      return; // No models to display
    }

    models.Results.forEach(model => {
      const option = document.createElement("option");
      option.value = model.Model_ID;  // Use Model_ID for value
      option.text = model.Model_Name; // Use Model_Name for display text
      modelDropdown.appendChild(option);
    });

    log('info', `Models fetched successfully for ${uiMakeId} in ${uiYear}`);
  } catch (error) {
    log('error', `Error fetching models: ${error.message}`);
  }
}

async function fetchTrims() {
  const trimDropdown = document.getElementById("submodel");
  trimDropdown.innerHTML = '<option value="">Select Sub-Model</option>'; // Reset dropdown

  const uiYear = document.getElementById('year').value;
  const uiMakeId = document.getElementById('make').value; // Using MakeId for NHTSA
  const uiMakeName = document.getElementById('make').options[document.getElementById('make').selectedIndex].text; // Get MakeName
  const uiModelName = document.getElementById('model').options[document.getElementById('model').selectedIndex].text; // Get ModelName

  if (!uiYear || !uiMakeName || !uiModelName) {
    log('warn', 'Please select year, make, and model to fetch submodels.');
    return; // Exit if year, make, or model is not selected
  }

  try {
    const response = await fetch(`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&year=${uiYear}&make=${uiMakeName}&model=${uiModelName}`);

    if (!response.ok) throw new Error(`Failed to fetch trims: ${response.statusText}`);

    const data = await response.json();
    const trims = data.Trims;  // Assuming CarQuery returns "Trims"

    if (!trims || trims.length === 0) {
      log('info', `No submodels found for ${uiMakeName} ${uiModelName} in ${uiYear}.`);
      return; // No trims to display
    }

    trims.forEach(trim => {
      const option = document.createElement("option");
      option.value = trim.model_trim;  // Trim identifier
      option.text = `${trim.model_trim} - ${trim.model_engine_type} (${trim.model_engine_cc}cc)`;  // Display trim name with engine details
      trimDropdown.appendChild(option);
    });

    log('info', `Sub-models (trims) fetched successfully for ${uiMakeName} ${uiModelName} in ${uiYear}`);
  } catch (error) {
    log('error', `Error fetching sub-models: ${error.message}`);
  }
}

function handleFormSubmit(event) {
  event.preventDefault(); // Prevent the default form submission
  log('info', 'Form submitted successfully.');
  // Handle form submission logic here, e.g., send data to the server
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  app(); // Start the application
  document.getElementById('type').addEventListener('change', fetchMakes);
  document.getElementById('year').addEventListener('change', fetchModels);
  document.getElementById('make').addEventListener('change', fetchModels);
  document.getElementById('model').addEventListener('change', fetchTrims);
  document.getElementById('booking-form').addEventListener('submit', handleFormSubmit);
});

function log(type, message) {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${message}`);
}