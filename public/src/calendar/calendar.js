// Import Firebase modules and configuration
import {
  app,
  database as db,
  databaseRef as ref,
  set,
  get,
  child,
  update,
  auth,
  sendEmailVerification,
  storage,
  storageRef,
  listAll,
  getDownloadURL,
	onValue,
} from "../firebase/FixThings-CustomerAppfirebaseConfig.js";
//this info exists already
			// 			    name: 
			// 			    email: 
			// 			    phone: 
			// 			    carYear: 
			// 			    carMake: 
			// 			    carModel: 
			// 			    carTrim: 
			// 			    comments: 
			// 			    submitDate: 
			// 					booked: 
			// 					bookingEmail:
			// 					reviewed: 
			//					ticketNumber:
			
			
//this is to grab and read ticketNumber
//and fetch all data from realtime database
//only need to use few peices of info

const urlParams = new URLSearchParams(window.location.search);
const ticketNumber = urlParams.get('ticketNumber') || 51;
let customerInfo;
if (!ticketNumber) {
  // Hide the entire app
	console.log("No ticketNumber parameter found.");
  document.body.style.display = 'none';
  // Show a 404 message
  const errorPage = document.createElement('div');
  errorPage.innerHTML = "<h1>404 Not Found</h1><p>The requested page could not be found.</p>";
  document.body.appendChild(errorPage);
} else {
  console.log("ticketNumber found:", ticketNumber);
	const customerRef = ref(db, `customers/${ticketNumber}`);
	const snapshot = await get(customerRef);
	if (!snapshot.exists()) throw new Error("Lead not found.");
	customerInfo = snapshot.val();
	console.log("Customer Name:" + customerInfo.name);
	const data = {
	    name: customerInfo.name,
	    email: customerInfo.email,
			ticketNumber: ticketNumber,
	  };
		console.log("Ready To Book");
}
// Fetch customer data
async function fetchCustomerData() {
  try {
    const customerRef = ref(db, `customers/${ticketNumber}`);
    const snapshot = await get(customerRef);
    if (!snapshot.exists()) {
      throw new Error("Lead not found.");
    }
    return snapshot.val();
  } catch (error) {
    console.error("Error fetching customer data:", error);
    alert("Failed to retrieve customer data.");
    throw error;
  }
}

async function updateCustomerData(slotTime, bookingData) {
  try {
    if (!slotTime || !bookingData) {
      throw new Error('Invalid slotTime or bookingData provided');
    }

    const updatedCustomerInfo = await fetchCustomerData();
    if (!updatedCustomerInfo) {
      throw new Error("Customer data is missing.");
    }

    const updatedData = {
      booked: 'yes',
      apptDate: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bookingData: bookingData,
    };

    console.log('Updated Data:', updatedData);  // Check if data is correct
    await update(ref(db, `customers/${ticketNumber}`), updatedData);

    alert(`Booking confirmed for ${updatedCustomerInfo.name} at ${slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  } catch (error) {
    console.error("Error updating customer data:", error.message || error);
    alert("Failed to update customer data. Check the console for more details.");
  }
}

async function sendConfirmationEmail() {
	const customerRef = ref(db, `customers/${ticketNumber}`);
	const snapshot = await get(customerRef);
	if (!snapshot.exists()) throw new Error("Lead not found.");
	const customerInfo = snapshot.val();
	
  try {
    const postmarkTempID = 'booked-email';
    if (!postmarkTempID) {
      throw new Error("Postmark Template ID is missing.");
    }
    const emailPayload = {
      To: customerInfo.email,
      TemplateAlias: postmarkTempID,
      TemplateModel: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        ticketNumber: customerInfo.ticketNumber,
        carMake: customerInfo.carMake,
        carModel: customerInfo.carModel,
        carYear: customerInfo.carYear,
        comments: customerInfo.comments || "None provided",
        submit_date: customerInfo.submitDate,
				booked: customerInfo.booked,
				bookingEmail: customerInfo.bookingEmail,
				reviewed: customerInfo.reviewed,
				
      },
    };

    const response = await fetch('https://fixthings.pro/api/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
			mode: 'cors',
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.log("error", `Server error ${response.status}: ${responseBody}`, {
        status: response.status,
        responseBody,
      });
      throw new Error(`Server error: ${response.statusText}`);
    }

    console.log("info", "Confirmation email sent successfully", { responseBody });
  } catch (error) {
    if (error.name === "TypeError") {
      // Likely a network or CORS issue
      console.log("error", "Fetch error, possibly network or CORS related", {
        message: error.message,
      });
    } else {
      // Generic or server error
      console.log("error", "Failed to send confirmation email", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

const dayView = document.querySelector('#dayView');
const monthView = document.querySelector('#monthView');
const monthViewBtn = document.querySelector('#monthViewBtn');
monthViewBtn.addEventListener("click", () => toggleViews());
function toggleViews() {
  // Hide both views
  dayView.style.display = 'none';
  monthView.style.display = 'none';
  // Toggle visibility of the appropriate view
  if (monthView.style.display === 'none' || !monthView.style.display) {
    monthView.style.display = 'block';
    dayView.style.display = 'none';
  } else {
    dayView.style.display = 'block';
    monthView.style.display = 'none';
  }
}
// Date and calendar setup
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;
function renderCalendar() {
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  document.getElementById("monthLabel").textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${currentYear}`;
  const calendarBody = document.getElementById("calendarBody");
  calendarBody.innerHTML = "";
  let row = document.createElement("tr");
  for (let i = 0; i < startDay; i++) {
    row.appendChild(document.createElement("td"));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      calendarBody.appendChild(row);
      row = document.createElement("tr");
    }
    const cell = document.createElement("td");
    cell.textContent = day;
    if (day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
      cell.classList.add("current-day");
    }
    cell.onclick = () => selectDay(day);
    row.appendChild(cell);
  }
  calendarBody.appendChild(row);
}
// Month navigation buttons
const nextMonthBtn = document.querySelector('#nextMonthBtn');
const prevMonthBtn = document.querySelector('#prevMonthBtn');
nextMonthBtn.addEventListener("click", () => changeMonth(+1));
prevMonthBtn.addEventListener("click", () => changeMonth(-1));
const nextDayBtn = document.querySelector('#nextDayBtn');
const prevDayBtn = document.querySelector('#prevDayBtn');
nextDayBtn.addEventListener("click", () => changeDay(+1));
prevDayBtn.addEventListener("click", () => changeDay(-1));
function changeMonth(direction) {
  // Only allow navigation within 3 months
  if (direction === 1 && currentMonth < new Date().getMonth() + 2) {
    currentMonth++;
  } else if (direction === -1 && currentMonth > new Date().getMonth()) {
    currentMonth--;
  }
  renderCalendar();
}
function changeDay(direction) {
  selectedDate.setDate(selectedDate.getDate() + direction);
  document.getElementById("selectedDate").textContent = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  fetchBookingData(selectedDate); // Refresh the booking slots for the new day
}
  
function renderBookingSlots() {
  const bookingSlots = document.getElementById("bookingSlots");
  bookingSlots.innerHTML = '';
  for (let hour = 9; hour < 17; hour++) {
    const slot = document.createElement('div');
    slotTime = new Date(selectedDate);
    slotTime.setHours(hour);
    slotTime.setMinutes(0);
    const isAvailable = bookingData[hour] && bookingData[hour].available;
    const slotLabel = document.createElement('span');
    slotLabel.textContent = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bookButton = document.createElement('button');
    bookButton.textContent = isAvailable ? 'Book' : 'Unavailable';
    bookButton.disabled = !isAvailable;
    if (isAvailable) {
      bookButton.addEventListener('click', () => bookSlot(hour));
    }
    slot.appendChild(slotLabel);
    slot.appendChild(bookButton);
    bookingSlots.appendChild(slot);
  }
}
function fetchBookingData(date) {
  const formattedDate = date.toISOString().split('T')[0];
  const bookingRef = ref(db, 'bookings/' + formattedDate);
  // Listen for real-time updates
  onValue(bookingRef, (snapshot) => {
    if (snapshot.exists()) {
      bookingData = snapshot.val();
    } else {
      bookingData = generateDefaultSlots();
      set(bookingRef, bookingData);
    }
    renderBookingSlots();
  }, (error) => {
    console.error("Error fetching data: ", error);
    alert("Failed to load booking data.");
  });
}
let bookingData;
let slotTime;
function bookSlot(hour) {
  slotTime = new Date(selectedDate);
  slotTime.setHours(hour);
  slotTime.setMinutes(0);
  const userName = customerInfo.name;

  if (!userName) {
    alert("Booking cancelled.");
    return;
  }

  const formattedDate = selectedDate.toISOString().split('T')[0];
  const bookingRef = ref(db, `bookings/${formattedDate}/${hour}`);
  bookingData = {
    available: false,
    bookedBy: userName,
    time: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ticketNumber: ticketNumber,
  };

  update(bookingRef, bookingData)
    .then(() => {
      alert(`Booking confirmed for ${userName} at ${slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      updateCustomerData(slotTime, bookingData); // Pass as arguments
      renderBookingSlots();
    })
    .catch((error) => {
      console.error("Error updating booking data: ", error);
      alert("Failed to complete the booking. Please try again.");
    });
}
// Simulated booking slots (9am to 5pm)
function generateDefaultSlots() {
  const slots = {};
  for (let hour = 9; hour < 17; hour++) {
    slots[hour] = { available: true };
  }
  return slots;
}
function selectDay(day) {
  selectedDate = new Date(currentYear, currentMonth, day);
  document.getElementById("selectedDate").textContent = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  dayView.style.display = 'block';
	monthView.style.display = 'none';
  fetchBookingData(selectedDate);
}

renderCalendar();