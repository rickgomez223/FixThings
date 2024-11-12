import { 
  app, database as db, databaseRef as ref, set, get, child, update, remove, auth, sendEmailVerification 
} from "../src/firebase/FixThings-CustomerAppfirebaseConfig.js";

// Logging function with proper type handling
function log(type, message, data = {}) {
  const allowedTypes = ["log", "warn", "error", "info"];
  const timestamp = `[${new Date().toISOString()}]`;
  const logEntry = `${timestamp} [${type.toUpperCase()}]: ${message}`;

  if (allowedTypes.includes(type)) {
    console[type](logEntry, data);
  } else {
    console.error(`${timestamp} [ERROR]: Invalid log type: ${type}`, data);
  }
}

// Main initialization function that runs on document load
async function initializeApp() {
  log('info', 'Document Loaded');
  try {
    await fetchCustomerLeads();
  } catch (error) {
    log('error', error.message);
  }
  log('info', 'Initialization Complete');
}

// Variables for DOM elements
const leadsTable = document.querySelector('#leadsTable');
const leadsTableBody = document.querySelector('#leadsTable tbody');
const selectAllCheckbox = document.querySelector('#selectAll'); 
const loadingBarCont = document.querySelector('#loadingBarContainer');
const loadingBar = document.querySelector('#loadingBar');
const noCustSign = document.querySelector('#noCust');
// const selectAllBtn = document.querySelector('#selectAllBtn');
const deleteBtn = document.querySelector('#deleteSelectedBtn');
const refreshBtn = document.querySelector('#refreshPage');
const panel = [ deleteBtn, refreshBtn];

// Loading Bar functions
function startLoading() {
  loadingBarCont.style.display = 'block';
  loadingBar.style.width = '0%';
  setTimeout(() => loadingBar.style.width = '100%', 100); // Animation
}

function stopLoading() {
  loadingBar.style.width = '100%';
  setTimeout(() => {
    loadingBarCont.style.display = 'none';
    loadingBar.style.width = '0%';
  }, 300);
}

// Fetch customer leads from Firebase
// Fetch customer leads from Firebase
async function fetchCustomerLeads() {
  panel.forEach(element => element.style.display = 'none');
  startLoading();
  try {
    const customerSnap = await get(ref(db, 'customers'));
    const customers = customerSnap.val();
    
    leadsTableBody.innerHTML = ''; // Clear table
    let foundCustomer = false; // Flag to track if we find a customer with bookingEmail: 'no'

    // Iterate over each customer
    Object.keys(customers).forEach(ticketNumber => {
      const lead = customers[ticketNumber];

      // Only proceed if bookingEmail is 'no'
      if (lead.bookingEmail === 'no') {
				
        foundCustomer = true; // We found at least one customer
        const row = document.createElement('tr');
        row.dataset.ticketNumber = ticketNumber;
        row.innerHTML = `
          <td><input type="checkbox" class="selectLead"></td>
          <td>${lead.ticketNumber || 'N/A'}</td>
          <td>${lead.name || 'N/A'}</td>
          <td>${lead.submitDate || 'n/a'}</td>
          <td>
            <button id="viewLeadBtn_${ticketNumber}" onclick="viewLead('${ticketNumber}')">View Details</button>
          </td>
        `;
        leadsTableBody.appendChild(row);
        const viewButton = document.querySelector(`#viewLeadBtn_${ticketNumber}`);
        viewButton.addEventListener('click', () => viewLead(ticketNumber));
      }
    });
    
    // Show noCustSign if no customers with bookingEmail 'no' were found
    if (!foundCustomer) {
      noCustSign.style.display = 'block';
			log('info',"No customers found or data is empty.");
    }

    const checkboxes = document.querySelectorAll('.selectLead');
    checkboxes.forEach(checkbox => checkbox.addEventListener('click', toggleDeleteButton));

  } catch (error) {
    log('error', `Error fetching customer leads: ${error.message}`);
  } finally {
    stopLoading();
    panel.forEach(element => element.style.display = 'block');
  }
}

// View lead details
// View the lead details (already implemented in your code)
window.viewLead = async function(ticketNumber) {
  startLoading();
  try {
    const leadRef = ref(db, `customers/${ticketNumber}`);
    const snapshot = await get(leadRef);

    if (!snapshot.exists()) throw new Error("Lead not found.");
    
    const lead = snapshot.val();
    document.querySelector('#modalTicketNumber').innerText = lead.ticketNumber || 'N/A';
    document.querySelector('#modalName').innerText = lead.name || 'N/A';
    document.querySelector('#modalEmail').innerText = lead.email || 'N/A';
    document.querySelector('#modalPhone').innerText = lead.phone || 'N/A';
    document.querySelector('#modalVehicle').innerText = lead.vehicle || 'N/A';
    document.querySelector('#modalComments').innerText = lead.comments || 'No comments provided';
    
    // Set the ticket number for the delete button
    document.querySelector('#deleteLeadBtn').dataset.ticketNumber = ticketNumber;
    
    // Show the modal
    document.querySelector('#leadModal').style.display = 'block';

  } catch (error) {
    log('error', `Error fetching lead details for ticket ${ticketNumber}: ${error.message}`);
  } finally {
    stopLoading();
  }
};

// Handle closing the modal when clicking the close button
const modal = document.querySelector('#leadModal');
const closeModalBtn = document.querySelector('.close');

// Close modal when clicking the close button
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when clicking outside of modal content
window.addEventListener('touchstart', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Close modal when pressing the Escape key
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.style.display === 'block') {
    modal.style.display = 'none';
  }
});

// Email customer handler
document.querySelector('#emailCustomerBtn').addEventListener('touchend', async function () {
  const customerEmail = document.querySelector('#modalEmail').innerText;
  const ticketNumber = document.querySelector('#modalTicketNumber').innerText;

  if (customerEmail === 'N/A') {
    alert("This customer does not have a valid email address.");
    return;
  }

  try {
    const customerInfoDb = await get(ref(db, `customers/${ticketNumber}`));
    if (!customerInfoDb.exists()) throw new Error(`No data found for ticket ${ticketNumber}`);

    const customerInfo = customerInfoDb.val();

    // Postmark payload for sending email
    const postmarkPayload = {
      To: customerEmail,
      TemplateAlias: 'schedule-service',
      TemplateModel: { ...customerInfo },
    };

    console.log('Postmark Payload:', JSON.stringify(postmarkPayload, null, 2));

    // Send email request
    const response = await fetch('https://fixthings.pro/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postmarkPayload),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }

    alert(`Email sent successfully to ${customerEmail}`);

    // Update customer info with the "booked: sent" status
    await update(ref(db, `customers/${ticketNumber}`), {
      bookingEmail: 'sent',
			booked: 'pending customer',
			
    });

    console.log(`Customer ${ticketNumber} updated with 'booked: sent' status`);
		refreshPage();
  } catch (error) {
    log('error', `Error sending email: ${error.message}`);
    alert(`Email error: ${error.message}`);
  } finally {
    stopLoading();
  }
});

// Toggle delete button based on selected leads
function toggleDeleteButton() {
  const selectedLeads = document.querySelectorAll('.selectLead:checked');
  deleteBtn.disabled = selectedLeads.length === 0;
}


// Delete selected leads
window.deleteSelectedLeads = async function() {
  const selectedLeads = document.querySelectorAll('.selectLead:checked');
  if (selectedLeads.length === 0) {
    alert("Please select at least one lead to delete.");
    return;
  }

  if (confirm("Are you sure you want to delete the selected leads?")) {
    for (const checkbox of selectedLeads) {
      const row = checkbox.closest('tr');
      const ticketNumber = row.dataset.ticketNumber;

      try {
        await remove(ref(db, `customers/${ticketNumber}`));
        row.remove(); // Remove row from table
        log('info', `Lead #${ticketNumber} deleted.`);
      } catch (error) {
        log('error', `Failed to delete lead #${ticketNumber}: ${error.message}`);
      }
    }
  }
};

function handleSelectAll() {
  const checkboxes = document.querySelectorAll('.selectLead');
  const isChecked = selectAllCheckbox.checked;

  // Set the state of all checkboxes based on the Select All checkbox
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });

  // Toggle the delete button based on the selected checkboxes
  toggleDeleteButton();
}

function refreshPage() {
  fetchCustomerLeads();  // Call the function to re-fetch customer leads from Firebase
  console.log("Page refreshed and customer leads reloaded.");
}


// Event listeners for Select All functionality
selectAllCheckbox.addEventListener('change', handleSelectAll);
deleteBtn.addEventListener('click', deleteSelectedLeads);
refreshBtn.addEventListener('click', refreshPage);
// Initialize the app on DOMContentLoaded
document.addEventListener("DOMContentLoaded", initializeApp);