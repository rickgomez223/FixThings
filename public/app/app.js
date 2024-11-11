import { 
	app, database as db, ref, set, get, child, update, remove, auth, sendEmailVerification
} from "../src/firebase/FixThings-CustomerAppfirebaseConfig.js";

// Section For Const/Vars
var loadingBarCont = document.querySelector('#loadingBarContainer');
var loadingBar = document.querySelector('#loadingBar');
var leadsTable = document.querySelector('#leadsTable');
var leadsTableBody = document.querySelector('#leadsTable tbody');
var selectAllCheckbox = document.querySelector('#selectAll');  
var selectAllBtn = document.querySelector('#selectAllBtn'); 
var deleteBtn = document.querySelector('#deleteSelectedBtn');
var noCustSign = document.querySelector('#noCust');
var refreshBtn = document.querySelector('#refreshPage');
var panel = [selectAllBtn, deleteBtn, refreshBtn];

refreshBtn.addEventListener('click', function() {
  fetchCustomerLeads();
});




// Loading Bar functions
function startLoading() {
  loadingBarCont.style.display = 'block';
  loadingBar.style.width = '0%';
  setTimeout(() => {
    loadingBar.style.width = '100%';
  }, 100); // Give a little time for smooth animation
}

function stopLoading() {
  loadingBar.style.width = '100%';
  setTimeout(() => {
    loadingBarContainer.style.display = 'none';
    loadingBar.style.width = '0%';
  }, 300); // Wait a bit before hiding the loading bar
}

// Fetching customers data from Firebase
async function fetchCustomerLeads() {
	panel.forEach(element => {
  		element.style.display = 'none';
			});
  startLoading();  // Show the loading bar
	var customerSnap = await get(ref(db, 'customers'));
  try {
    // Check if the snapshot exists and contains data
    if (!customerSnap.exists() || !customerSnap.val()) {
      throw new Error("No customers found or data is empty.");
      noCustSign.style.display = 'block';
			panel.forEach(element => {
  		element.style.display = 'none';
			});
    }

    var customers = customerSnap.val();
    noCustSign.style.display = 'none';
    leadsTableBody.innerHTML = ''; // Clear previous entries

    Object.keys(customers).forEach(ticketNumber => {
      const lead = customers[ticketNumber];
      const row = document.createElement('tr');
      row.dataset.ticketNumber = ticketNumber; // Add ticket number as data attribute

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

      // Add event listener for each view button
      const viewButton = document.querySelector(`#viewLeadBtn_${ticketNumber}`);
      viewButton.addEventListener('click', () => viewLead(ticketNumber));
    });

    // Add event listeners to checkboxes for toggling the delete button
    const checkboxes = document.querySelectorAll('.selectLead');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('click', toggleDeleteButton);
    });
  } catch (error) {
    console.error(error.message);
  } finally {
    stopLoading();  // Hide the loading bar
		panel.forEach(element => {
  	element.style.display = 'block';
		});
  }
}

// Function to display the lead details
// Define viewLead as a global function
window.viewLead = async function(ticketNumber) {
  startLoading();  // Show the loading bar
  try {
    const leadRef = ref(db, `customers/${ticketNumber}`);
    const snapshot = await get(leadRef);

    if (snapshot.exists()) {
      const lead = snapshot.val();

      document.querySelector('#modalTicketNumber').innerText = lead.ticketNumber || 'N/A';
      document.querySelector('#modalName').innerText = lead.name || 'N/A';
      document.querySelector('#modalEmail').innerText = lead.email || 'N/A';
      document.querySelector('#modalPhone').innerText = lead.phone || 'N/A';
      document.querySelector('#modalVehicle').innerText = lead.vehicle || 'N/A';
      document.querySelector('#modalComments').innerText = lead.comments || 'No comments provided';

      // Attach ticket number to delete button for context
      document.querySelector('#deleteLeadBtn').dataset.ticketNumber = ticketNumber;

      // Display the modal
      document.querySelector('#leadModal').style.display = 'block';
    } else {
      console.error('Lead not found.');
    }
  } catch (error) {
    console.error(`Error fetching lead details: ${error.message}`);
  } finally {
    stopLoading();  // Hide the loading bar
  }
};

document.querySelector('#emailCustomerBtn').addEventListener('click', async function () {
  const customerEmail = document.querySelector('#modalEmail').innerText;
  const ticketNumber = document.querySelector('#modalTicketNumber').innerText;
  const customerName = document.querySelector('#modalName').innerText;
  const custPhone = document.querySelector('#modalPhone').innerText;
  const carMake = document.querySelector('#modalCarMake').innerText;
  const carModel = document.querySelector('#modalCarModel').innerText;
  const carYear = document.querySelector('#modalCarYear').innerText;
  const carTrim = document.querySelector('#modalCarTrim').innerText;
  const comments = document.querySelector('#modalComments').innerText;

  // Validate email
  if (customerEmail === 'N/A') {
    alert("This customer does not have a valid email address.");
    return;
  }

  startLoading(); // Show the loading bar

  try {
    // Construct the email subject
    const emailSubject = `Follow-Up Regarding Your Ticket #${ticketNumber}`;

    // Construct the payload for Firebase Cloud Function
    const postmarkPayload = {
      To: customerEmail,  // Customer's email
      TemplateId: 'schedule-service', // Replace with your Postmark template ID
      TemplateModel: {
        name: customerName,
        phone: custPhone,
        ticketNumber: ticketNumber,
        carMake: carMake,
        carModel: carModel,
        carYear: carYear,
        carTrim: carTrim,
        comments: comments || "None provided"
      }
    };

    console.log('Postmark Payload:', JSON.stringify(postmarkPayload, null, 2));

    // Send the payload to the Firebase function for relaying to Postmark
    const response = await fetch('https://emailcustomerlead-77757u6a6q-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postmarkPayload),
    });

    // Handle the response
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData);
      alert(`Failed to send email: ${errorData.message || response.statusText}`);
    } else {
      alert(`Email sent successfully to ${customerEmail}`);
    }

  } catch (error) {
    console.error('Error details:', error);
    alert('An error occurred while sending the email.');
  } finally {
    stopLoading(); // Hide the loading bar
  }
});

// Function to close the lead details view
function closeDetails() {
  document.querySelector('#leadDetails').style.display = 'none';
}

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

// Also allow the Escape key to close the modal
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.style.display === 'block') {
    modal.style.display = 'none';
  }
});

// Toggle the delete button enabled/disabled based on selected leads
function toggleDeleteButton() {
  const selectedLeads = document.querySelectorAll('.selectLead:checked');
  deleteSelectedBtn.disabled = selectedLeads.length === 0;
}

// Function to handle Select All checkbox
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

// **Global function for deleting selected leads**
window.deleteSelectedLeads = async function() {
  const selectedLeads = document.querySelectorAll('.selectLead:checked');
  if (selectedLeads.length === 0) {
    alert("Please select at least one lead to delete.");
    return;
  }

  if (confirm("Are you sure you want to delete the selected leads?")) {
    selectedLeads.forEach(async (checkbox) => {
      const row = checkbox.closest('tr');
      const ticketNumber = row.dataset.ticketNumber;

      try {
        await remove(ref(db, `customers/${ticketNumber}`));
        row.remove(); // Remove the row from the table
        console.log(`Lead #${ticketNumber} deleted.`);
      } catch (error) {
        console.error(`Failed to delete lead #${ticketNumber}: ${error.message}`);
      }
    });
  }
};

// Initialize Select All functionality
selectAllCheckbox.addEventListener('change', handleSelectAll);

// Fetch customer data when the page loads
fetchCustomerLeads();