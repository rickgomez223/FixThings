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
    //
  } catch (error) {
    log('warn', 'App Failed'); // Log warning if main app fails
    log('error', error); // Log error details
  }
}
//
//
// App Logging And Statistics
//
function log(level, message) {
  // Log message with the appropriate log level
  if (console[level]) {
    console[level](new Date().toISOString() + ': ' + message); // Log with timestamp
  }
}