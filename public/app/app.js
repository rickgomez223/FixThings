import {
  app,
  database as db,
  ref,
  set,
  get,
  child,
  update, 
  remove, // Import remove function for deletion
  auth,
  sendEmailVerification
} from "https://fixthings.pro/src/firebase/FixThings-CustomerAppfirebaseConfig.js";

const leadsTableBody = document.querySelector('#leadsTable tbody');
const selectAllCheckbox = document.querySelector('#selectAll');  // This is the checkbox for "Select All"


// Fetching customers data from Firebase
async function fetchCustomerLeads() {
  try {
    const snapshot = await get(ref(db, 'customers'));
    if (!snapshot.exists()) {
      throw new Error("No customers found");
    }

    const customers = snapshot.val();
    leadsTableBody.innerHTML = ''; // Clear previous entries

    Object.keys(customers).forEach(ticketNumber => {
      const lead = customers[ticketNumber];
      const row = document.createElement('tr');
      row.dataset.ticketNumber = ticketNumber; // Add ticket number as data attribute

      row.innerHTML = `
        <td><input type="checkbox" class="selectLead"></td>
        <td>${lead.ticketNumber}</td>
        <td>${lead.name}</td>
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
  }
}

// Function to display the lead details
// Define viewLead as a global function
window.viewLead = async function(ticketNumber) {
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
  }
};

document.querySelector('#deleteLeadBtn').addEventListener('click', async function() {
  const ticketNumber = this.dataset.ticketNumber;

  if (confirm(`Are you sure you want to delete Ticket #${ticketNumber}?`)) {
    try {
      await remove(ref(db, `customers/${ticketNumber}`));
      alert(`Ticket #${ticketNumber} deleted successfully.`);
      document.querySelector('#leadModal').style.display = 'none'; // Close the modal
      fetchCustomerLeads(); // Refresh the table
    } catch (error) {
      console.error(`Error deleting lead: ${error.message}`);
    }
  }
});

document.querySelector('#emailCustomerBtn').addEventListener('click', async function () {
  const customerEmail = document.querySelector('#modalEmail').innerText;

  if (customerEmail === 'N/A') {
    alert("This customer does not have a valid email address.");
    return;
  }

  try {
    // Retrieve the Postmark API key from Firebase
    const snapshot = await get(ref(db, "apiKeys/POSTMARK_SERVER_KEY"));
    const postmark_key = snapshot.exists() ? snapshot.val() : null;

    if (!postmark_key) {
      alert("Postmark API key is not available.");
      return;
    }

    const ticketNumber = document.querySelector('#modalTicketNumber').innerText;
    const customerName = document.querySelector('#modalName').innerText;
    const emailSubject = `Follow-Up Regarding Your Ticket #${ticketNumber}`;
    const emailBody = `Hello ${customerName},\n\nWe are following up regarding your recent inquiry.\n\nBest regards,\nYour Company`;

    const postmarkPayload = {
      From: "kyle@fixthings.pro", // Replace with your sender email
      To: customerEmail,
      Cc: "rickgomez223@gmail.com", // Additional recipients
      Subject: emailSubject,
      TextBody: emailBody,
    };

    // Send the email via Postmark
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
				'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmark_key, // Use the retrieved Postmark key
      },
      body: JSON.stringify(postmarkPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Postmark Error:', errorData);
      alert(`Failed to send email: ${errorData.Message}`);
    } else {
      alert(`Email sent successfully to ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('An unexpected error occurred while sending the email.');
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
        console.log(`Lead with Ticket #${ticketNumber} deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting lead: ${error.message}`);
      }
    });
  }
}

// Call fetchCustomerLeads when the page is loaded
fetchCustomerLeads();

// Add event listener to Select All checkbox
selectAllCheckbox.addEventListener('change', handleSelectAll);

// Add event listeners to other buttons as needed
const closeDetailsBtn = document.querySelector('#closeDetailsBtn');
if (closeDetailsBtn) {
  closeDetailsBtn.addEventListener('click', closeDetails);
}

const deleteSelectedBtn = document.querySelector('#deleteSelectedBtn');
if (deleteSelectedBtn) {
  deleteSelectedBtn.addEventListener('click', deleteSelectedLeads);
}