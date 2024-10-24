//
// Logging Function
//
function log(type, message) {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${type.toUpperCase()}: ${message}`);
}

//
//
//
// Auto Start App
//
//
//
document.addEventListener('DOMContentLoaded', function() {
  log('info', 'DOMContentLoaded'); // Log when DOM content is fully loaded
  try {
    log('info', 'Call To Start App'); // Log the attempt to start the app
    preApp(); // Initialize the pre-app logic
  } catch (error) {
    log('error', 'Call To Start App Failed'); // Log if app initialization fails
    log('error', error); // Log the error details
  }
});
//
//
//
//   Pre App Logic
//
// if i needed to hold ui until everything loads
//
function preApp() {
  log('info', 'PreApp Started'); // Log that the preApp has started
  try {
    //
    // Load The Services JSON
    //
    const servicesList = document.getElementById('services-list');
    const pricingTable = document.getElementById('pricing-table');

    fetch('./src/services.json') // Fetch the services JSON file
      .then(response => {
        if (!response.ok) { // Check for network errors
          throw new Error('Failed to load services.json: ' + response.statusText);
        }
        return response.json(); // Parse the JSON data
      })
      .then(services => {
        services.forEach(service => {
          //
          // Populate Services List
          //
          const listItem = document.createElement('li');
          listItem.textContent = service.name;
          listItem.classList.add('service-item');
          servicesList.appendChild(listItem);
          //
          //
          // Create Table Row With Service Data
          //
          const tableRow = document.createElement('tr');
          const serviceNameCell = document.createElement('td');
          const serviceLink = document.createElement('a'); // Create an anchor for the service name
          serviceLink.href = '#'; // Set link target (optional)
          serviceLink.textContent = service.name;
          serviceNameCell.appendChild(serviceLink);
          //
          const priceCell = document.createElement('td'); // Create price cell
          priceCell.textContent = '$' + service.price.replace('$', ''); // Remove extra '$' symbols if needed
          //
          const descriptionCell = document.createElement('td'); // Create description cell
          descriptionCell.textContent = service.description;
          //
          tableRow.appendChild(serviceNameCell);
          tableRow.appendChild(priceCell);
          tableRow.appendChild(descriptionCell);
          pricingTable.querySelector('tbody').appendChild(tableRow); // Append row to the table
          //
          //
          // Add Event Listener for Service Link (Popup)
          //
          serviceLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const serviceName = serviceLink.textContent; // Get service name
            const serviceData = services.find(service => service.name === serviceName); // Find service data by name
            //
            //
            // Populate the Pop-up With Service Data
            //
            const popup = document.getElementById('service-details-popup');
            popup.querySelector('h2').textContent = serviceData.name; // Set service name in popup
            popup.querySelector('p:nth-child(3)').textContent = serviceData.description; // Set description
            //
            const expenseList = popup.querySelector('ul'); // Target the expenses list in the popup
            expenseList.innerHTML = ''; // Clear previous expense list
            serviceData.expenses.forEach(expense => {
              const expenseItem = document.createElement('li'); // Create each expense item
              expenseItem.textContent = `${expense.name}: $${expense.cost}`; // Display expense
              expenseList.appendChild(expenseItem); // Add expense to list
            });
            //
            //
            // Show the Pop-up and Setup Close Mechanism
            //
            popup.classList.remove('hidden'); // Show the popup
            const closeButton = popup.querySelector('.close-button'); // Select close button
            closeButton.addEventListener('click', () => {
              popup.classList.add('hidden'); // Close popup when button is clicked
            });
            //
            //
            // Close the Popup When Clicking Outside
            //
            document.addEventListener('click', (event) => {
              if (event.target !== popup && !popup.contains(event.target)) {
                popup.classList.add('hidden'); // Hide if clicking outside of the popup
              }
            });
            //
            // Prevent event bubbling to other elements
            event.stopPropagation();
          });
        });
      })
      .catch(error => {
        log('error', 'Failed to fetch services JSON'); // Log fetch errors
        log('error', error); // Log error details
      });
    //
    // Finished Loading Services JSON
    //
    //
    //
    // Load About Me Text
    //
    const aboutMeTxt = document.getElementById('aboutMeTxt');

    fetch('./src/aboutMe.txt') // Fetch the About Me text file
      .then(response => {
        if (!response.ok) { // Check for network errors
          throw new Error('Failed to load aboutMe.txt: ' + response.statusText);
        }
        return response.text(); // Parse response as plain text
      })
      .then(data => {
        aboutMeTxt.textContent = data; // Insert About Me content into the element
      })
      .catch(error => {
        log('error', 'There was a problem with the fetch operation for aboutMe.txt:'); // Log fetch errors
        log('error', error); // Log error details
      });
    //
    // Finished Loading About Me Text
    //
    //
    //
    //
    //
    // Load Carousel
    //
    //
    //
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselImages = document.querySelectorAll('.carousel-slide img');
    //
    //
    let counter = 0; // Start counter at 0 (first image)
    const size = carouselImages[0].clientWidth; // Get the width of the first image
    //
    //
    //
    // Initial Carousel Position
    //
    carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)'; // Move to the first image
    //
    //
    //
    // Add Event Listeners for Manual Carousel Controls
    //
    // document.getElementById('nextBtn').addEventListener('click', () => {
    //   moveToNextImage();
    // });
    // //
    // //
    // document.getElementById('prevBtn').addEventListener('click', () => {
    //   moveToPrevImage();
    // });
    //
    //
    //
    // Move to the next image
    //
    function moveToNextImage() {
      if (counter >= carouselImages.length - 1) {
        counter = -1; // Reset counter to make it circle
      }
      //
      carouselSlide.style.transition = "transform 0.4s ease-in-out"; // Smooth transition
      counter++;
      carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)'; // Move to the next image
    }
    //
    //
    //
    // Move to the previous image
    //
    function moveToPrevImage() {
      if (counter <= 0) {
        counter = carouselImages.length; // Reset counter to make it circle backwards
      }
      //
      carouselSlide.style.transition = "transform 0.4s ease-in-out"; // Smooth transition
      counter--;
      carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)'; // Move to the previous image
    }
    //
    //
    //
    // Auto-slide every 3 seconds
    //
    setInterval(() => {
      moveToNextImage(); // Automatically move to the next image
    }, 3000); // Change image every 3 seconds
    //
    //
    //
    // Finished Carousel Load
    //
    //
    //
    // Load Pricing Text
    //
    //
    const pricingTxt = document.getElementById('pricingTxt');

    fetch('./src/pricing.txt') // Fetch the Pricing text file
      .then(response => {
        if (!response.ok) { // Check for network errors
          throw new Error('Failed to load pricing.txt: ' + response.statusText);
        }
        return response.text(); // Parse response as plain text
      })
      .then(data => {
        pricingTxt.textContent = data; // Insert pricing content into the element
      })
      .catch(error => {
        log('error', 'There was a problem with the fetch operation for pricing.txt:'); // Log fetch errors
        log('error', error); // Log error details
      });
    //
    // Finished Loading Pricing Text
    //
    //



    app(); // Proceed to main app logic
  } catch (error) {
    log('warn', 'PreApp Failed'); // Log warnings if PreApp logic fails
    log('error', error); // Log the error details
  }
}
//
//
// Main App Logic
//
function app() {
  log('info', 'App Started'); // Log when the main app starts
  try {
    //
    // Main Logic Here

    // Populate the years dropdown from 1990 up to current year
    populateYearsDropdown();

    // contact form stuff
    const apiEndpoint = "https://vpic.nhtsa.dot.gov/api/vehicles/GetAllModelsForMakeYear/";

    async function fetchMakes() {
      const selectedYear = document.getElementById("year").value;
      const makeDropdown = document.getElementById("make");
      makeDropdown.innerHTML = '<option value="">Select Make</option>'; // Clear previous makes
      try {
        const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}`);
        if (!response.ok) {
          log('error', `Failed to fetch makes: ${response.statusText}`);
          throw new Error('Failed to fetch makes');
        }
        const makes = await response.json(); 
        makes.Results.forEach(make => {
          const option = document.createElement("option");
          option.value = make;
          option.text = make;
          makeDropdown.appendChild(option);
        });
        log('info', `Makes fetched successfully for year ${selectedYear}`);
      } catch (error) {
        log('error', `Error fetching makes: ${error.message}`);
      }
    }
    async function fetchModels() {
      const selectedYear = document.getElementById("year").value;
      const selectedMake = document.getElementById("make").value;
      const modelDropdown = document.getElementById("model");
      modelDropdown.innerHTML = '<option value="">Select Model</option>'; // Clear previous models
      try {
        const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}&make=${selectedMake}`);
        if (!response.ok) {
          log('error', `Failed to fetch models: ${response.statusText}`);
          throw new Error('Failed to fetch models');
        }
        const models = await response.json();
        models.Results.forEach(model => {
          const option = document.createElement("option");
          option.value = model;
          option.text = model;
          modelDropdown.appendChild(option);
        });
        log('info', `Models fetched successfully for year ${selectedYear} and make ${selectedMake}`);
      } catch (error) {
        log('error', `Error fetching models: ${error.message}`);
      }
    }
    async function fetchSubmodels() {
      const selectedYear = document.getElementById("year").value;
      const selectedMake = document.getElementById("make").value;
      const selectedModel = document.getElementById("model").value;
      const submodelDropdown = document.getElementById("submodel");
      submodelDropdown.innerHTML = '<option value="">Select Sub-Model</option>'; // Clear previous sub-models

      try {
        const response = await fetch(`${apiEndpoint}?format=json&year=${selectedYear}&make=${selectedMake}&model=${selectedModel}`);
        if (!response.ok) {
          log('error', `Failed to fetch sub-models: ${response.statusText}`);
          throw new Error('Failed to fetch sub-models');
        }
        const submodels = await response.json(); 
        submodels.Results.forEach(submodel => {
          const option = document.createElement("option");
          option.value = submodel; 
          option.text = submodel;
          submodelDropdown.appendChild(option);
        });
        log('info', `Submodels fetched successfully for year ${selectedYear}, make ${selectedMake}, and model ${selectedModel}`);
      } catch (error) {
        log('error', `Error fetching sub-models: ${error.message}`);
      }
    }
    // Call fetchYears() to populate the year dropdown initially
    // fetchYears();
    // 
    // populate services dropdown from services-list
    fetchServices();


  } catch (error) {
    log('warn', 'App Failed'); // Log warning if main app fails
    log('error', error); // Log error details
  }
}
//
//

//
// Populate Years Dropdown
//
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
//
//
// Populate Services Dropdown
//
function fetchServices() {
  const serviceDropdown = document.getElementById('service');
  const servicesList = document.getElementById('services-list'); // Get the list of services
  const serviceItems = servicesList.querySelectorAll('li'); // Select all li elements in the list

  serviceItems.forEach(item => {
    const option = document.createElement('option');
    option.value = item.textContent; // Use the service name as the value
    option.text = item.textContent;
    serviceDropdown.appendChild(option);
  });
}