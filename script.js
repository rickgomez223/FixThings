document.addEventListener('DOMContentLoaded', function() {
  log('info', 'DOMContentLoaded');
  try {
    log('info', 'Call To Start App');
    app();
  } catch (error) {
    log('error', 'Call To Start App Failed');
  }
});

window.onload = function() {
  log('info', 'Window Load');
  try {
    log('info', 'Call To Start App');
    app();
  } catch (error) {
    log('error', 'Call To Start App Failed');
  }
};

function app() {
  log('info', 'App Started');
  try {
    const servicesList = document.getElementById('services-list');
    const pricingTable = document.getElementById('pricing-table');

    fetch('services.json')
      .then(response => response.json())
      .then(services => {
        services.forEach(service => {
          const listItem = document.createElement('li');
          listItem.textContent = service.name;
          listItem.classList.add('service-item');
          servicesList.appendChild(listItem);

          // Create table row with an anchor tag
          const tableRow = document.createElement('tr');
          const serviceNameCell = document.createElement('td');
          const serviceLink = document.createElement('a'); // Create the anchor tag
          serviceLink.href = '#'; // Set the link to '#' (not necessary for this case)
          serviceLink.textContent = service.name; 
          serviceNameCell.appendChild(serviceLink); // Append the link to the cell
          const priceCell = document.createElement('td');
          priceCell.textContent = '$' + service.price.replace('$', '');
          const descriptionCell = document.createElement('td');
          descriptionCell.textContent = service.description;
          tableRow.appendChild(serviceNameCell);
          tableRow.appendChild(priceCell);
          tableRow.appendChild(descriptionCell);
          pricingTable.querySelector('tbody').appendChild(tableRow);

          // Add event listener to the anchor tag
          serviceLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const serviceName = serviceLink.textContent;
            const serviceData = services.find(service => service.name === serviceName);

            // Populate the pop-up
            const popup = document.getElementById('service-details-popup');
            popup.querySelector('h2').textContent = serviceData.name;
            popup.querySelector('p:nth-child(3)').textContent = serviceData.description;
            const expenseList = popup.querySelector('ul');
            expenseList.innerHTML = ''; // Clear previous list
            serviceData.expenses.forEach(expense => {
              const expenseItem = document.createElement('li');
              expenseItem.textContent = `${expense.name}: $${expense.cost}`;
              expenseList.appendChild(expenseItem);
            });

            // Show the pop-up
            popup.classList.remove('hidden');

            // Add close button functionality
            const closeButton = popup.querySelector('.close-button');
            closeButton.addEventListener('click', () => {
              popup.classList.add('hidden');
            });
            
            // Close the popup when clicking outside of it
            document.addEventListener('click', (event) => {
              if (event.target !== popup && !popup.contains(event.target)) {
                popup.classList.add('hidden');
              }
            });

            // Prevent event from bubbling up
            event.stopPropagation();
          });
        });
      });
  } catch (error) {
    log('error', 'App Failed');

  }
}


//
// App Logging And Statistics 
//
function log(level, message) {
  // Example call:
  // log('info', 'This is an informational message.');
  if (level === 'error') {
    console.error(message);
  } else if (level === 'warn') {
    console.warn(message);
  } else if (level === 'info') {
    console.info(message);
  } else if (level === 'debug') {
    console.debug(message);
  } else {
    console.log(message);
  }
}