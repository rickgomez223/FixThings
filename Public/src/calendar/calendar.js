// Import Firebase modules and configuration
import { app, database as db, databaseRef as ref, set, get, child, update, auth, sendEmailVerification, storage, storageRef, listAll, getDownloadURL, onValue } from "../firebase/FixThings-CustomerAppfirebaseConfig.js";
const devMode = "yes";
const appState = {
	ticketNumber: null,
	slotLength: null,
  initCustomerInfo: null,
  bookingData: {
		month: null,
		date: null,
		weekday: null,
		hour: null,
	},
  selectedDate: null, // The user-selected date
  slotTime: null, 	// Specific time for the booking
	newBookingData: null,
};
// app variables
const appKeys = {
  workingHours: { start: 9, end: 18 },
  bookedRef: () => ref(db, `bookings`),
  bookingRef: () => ref(db, `bookings/${appState.bookingData.month}/${appState.bookingData.date}/${appState.bookingData.hour}`),
  customerRef: () => ref(db, `customers/${appState.ticketNumber}`), // Function to dynamically fetch the latest ticketNumber
};
// Start
window.onload = async function() {
	console.log("window loaded checking for parameters");
	urlParamCheck();
}
// Use ticketNumber to identify customer and populate their data.
async function urlParamCheck() {
	const urlParams = new URLSearchParams(window.location.search);
	const slotLength = urlParams.get('slotLength');
	const ticketNumber = urlParams.get('ticketNumber');
    if (!ticketNumber) {
			if(devMode === "yes") {
				const promptDev = prompt("Please enter a number:");
				const number = parseFloat(promptDev);
					if (isNaN(number)) {
					  alert("That's not a valid number. Please try again.");
					} else {
					  console.log(`You entered: ${number}`);
					}
	      appState.ticketNumber = number;
				console.log("urlParm: ticketNumber found and set to " + number );
				
			} else {
	      document.body.innerHTML = "<h1>Error</h1><p>No ticket number provided.</p>";
				return; // Exit app if devMode not enabled
			}
    } else {
			appState.ticketNumber = ticketNumber;
			console.log("urlParm: ticketNumber found and set to " + appState.ticketNumber);
	}
	if (!slotLength) {
	      appState.slotLength = 1;
				console.log("urlParm: slotLength not found, set to 1.");
	} else {
		appState.slotLength = slotLength;
		console.log("urlParm: slotLength found and set to " + appState.slotLength);
	}
	try {
	  await fetchCustomerData();
	} catch (error) {
	    console.error("Error initializing app:", error.message);
	}
}
// Fetch customer data
async function fetchCustomerData() {
  try {
    const snapshot = await get(appKeys.customerRef());
    if (!snapshot.exists()) {
      throw new Error("Customer not found.");
    }
    const customerData = snapshot.val();
		console.log(customerData);
    if (customerData?.booked == "yes") {
      alert(`Ticket number ${appState.ticketNumber} is already booked.`);
			document.body.innerHTML = "<h1>Error:</h1><p>Booking is already set!</p>";
      return;
    }
		appState.initCustomerInfo = customerData;
		console.log("Customer Info Loaded:", appState.initCustomerInfo);
		renderEmptyCalendar(); // Render calendar after loading
   
  } catch (error) {
    console.error("Error fetching customer data:", error);
    alert("Failed to retrieve customer data.");
		document.body.innerHTML = "<h1>Error</h1><p>Unable to load customer data.</p>";
    throw error;
		return;
  }
}
function renderEmptyCalendar() {
  const currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate = null;
  const updateMonthLabel = (month, year) => {
    document.getElementById("monthLabel").textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
  };
  const clearCalendar = () => {
    const calendarBody = document.getElementById("calendarBody");
    calendarBody.innerHTML = "";
  };
  const createDayCell = (day, isToday) => {
    const cell = document.createElement("td");
    cell.textContent = day;
    if (isToday) {
      cell.classList.add("current-day");
    }
    cell.onclick = () => {
      selectedDate = new Date(currentYear, currentMonth, day);
      document.getElementById("selectedDate").textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      document.getElementById('dayView').style.display = 'block';
      document.getElementById('monthView').style.display = 'none';
      console.log(`Selected date: ${selectedDate}`);
			renderBookingSlots();
    };
    return cell;
  };
  const renderCalendar = () => {
    clearCalendar();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    updateMonthLabel(currentMonth, currentYear);
    const calendarBody = document.getElementById("calendarBody");
    let row = document.createElement("tr");
    // Fill initial empty cells
    for (let i = 0; i < firstDay; i++) {
      row.appendChild(document.createElement("td"));
  }
  // Fill the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = (
      day === currentDate.getDate() &&
      currentMonth === currentDate.getMonth() &&
      currentYear === currentDate.getFullYear()
    );
    row.appendChild(createDayCell(day, isToday));
    if (row.children.length === 7) {
      calendarBody.appendChild(row);
      row = document.createElement("tr");
    }
  }
  // Append any remaining cells
  if (row.children.length > 0) {
    calendarBody.appendChild(row);
    }
  };
  // Initial render
  renderCalendar();
	
	// Month navigation buttons
	const nextMonthBtn = document.querySelector('#nextMonthBtn');
	const prevMonthBtn = document.querySelector('#prevMonthBtn');
	nextMonthBtn.addEventListener("click", () => changeMonth(+1));
	prevMonthBtn.addEventListener("click", () => changeMonth(-1));
	function changeMonth(direction) {
	  // Only allow navigation within 3 months
	  if (direction === 1 && currentMonth < new Date().getMonth() + 2) {
	    currentMonth++;
	  } else if (direction === -1 && currentMonth > new Date().getMonth()) {
	    currentMonth--;
	  }
	  renderCalendar();
	}
	function renderBookingSlots() {
  const { start, end } = appKeys.workingHours; // Retrieve working hours
  const bookingSlots = document.getElementById("bookingSlots");
  bookingSlots.innerHTML = '';
		for (let hour = start; hour < end; hour++) {
			const slot = document.createElement('div');
	    // Flexible time formatting
	    const slotButton = document.createElement('button');
			slotButton.id = `slot-${formatHour(hour)}`;
	    slotButton.textContent = `${formatHour(hour)} - ${formatHour(hour + 1)}`;
	    slot.appendChild(slotButton);
	    bookingSlots.appendChild(slot);
			slotButton.addEventListener('click', () => {
          if (selectedDate) {
        // Set the selected date and hour on slotTime
        appState.selectedDate = selectedDate; // Store the selected date
        appState.slotTime = selectedDate; // Create a new Date object based on the selected date
        appState.slotTime.setHours(hour); // Set the hour for the slot
        appState.slotTime.setMinutes(0); // Set minutes to 0 to match the full hour
        appState.slotTime.setSeconds(0); // Optional: set seconds to 0
        console.log(`Selected Slot Time: ${appState.slotTime}`); // Log the selected time to console
        bookSlot();
				}
      });
      slot.appendChild(slotButton);
      bookingSlots.appendChild(slot)
			
		}
		function formatHour(hour) {
	  const period = hour >= 12 ? "PM" : "AM";
	  const standardHour = hour % 12 || 12; // Convert 24-hour to 12-hour format
	  return `${standardHour} ${period}`;
		}
		loadBookedSlots();
	}
	const nextDayBtn = document.querySelector('#nextDayBtn');
	const prevDayBtn = document.querySelector('#prevDayBtn');
	nextDayBtn.addEventListener("click", () => changeDay(+1));
	prevDayBtn.addEventListener("click", () => changeDay(-1));
	function changeDay(direction) {
	  appState.selectedDate.setDate(appState.selectedDate.getDate() + direction);
	  document.getElementById("selectedDate").textContent = appState.selectedDate.toLocaleDateString('en-US', {
	    weekday: 'long',
	    year: 'numeric',
	    month: 'long',
	    day: 'numeric'
	  });
	  fetchBookingData(selectedDate); // Refresh the booking slots for the new day
	}
}
// Step 3: Load Booked Slots and Disable Unavailable Ones
async function loadBookedSlots() {
  try {
    const snapshot = await get(appKeys.bookedRef()); // Fetch booked slots for selected date
    console.log(snapshot);

    if (!snapshot.exists()) {
      console.warn("No bookings found.");
      return; // If no bookings exist, just exit
    }

    const bookings = snapshot.val();
    console.log("Bookings loaded:", bookings);

    disableBookedSlots(bookings); // Pass the bookings to disable booked slots
  } catch (error) {
    console.error("Error loading booked slots:", error.message);
  }
}

// Function to disable already booked slots
function disableBookedSlots(bookings) {
  try {
    console.log("Starting to disable booked slots...");
    Object.keys(bookings).forEach(monthKey => {
      try {
        const monthBookings = bookings[monthKey];
        console.log(`Checking bookings for month: ${monthKey}`);
        Object.keys(monthBookings).forEach(dayKey => {
          try {
            const dayBookings = monthBookings[dayKey];
            console.log(`Checking bookings for day: ${dayKey}`);
            Object.keys(dayBookings).forEach(slotKey => {
              try {
                const bookedSlot = dayBookings[slotKey];
                // Check if the slot is booked (available = "no")
                if (bookedSlot.available === "no") {
                  const slotButton = document.getElementById(`slot-${slotKey}`);
                  // If the button exists, disable it and add "Unavailable" text
                  if (slotButton) {
                    console.log(`Disabling slot: ${slotKey} (Unavailable)`);
                    slotButton.disabled = true;
                    slotButton.textContent += " (Unavailable)"; // Optionally append text
                    slotButton.classList.add('disabled'); // Add 'disabled' class for styling
                  } else {
                    console.warn(`Slot button with ID 'slot-${slotKey}' not found.`);
                  }
                }
              } catch (slotError) {
                console.error(`Error processing slot ${slotKey}:`, slotError);
              }
            });
          } catch (dayError) {
            console.error(`Error processing day ${dayKey}:`, dayError);
          }
        });
      } catch (monthError) {
        console.error(`Error processing month ${monthKey}:`, monthError);
      }
    });
    console.log("Finished disabling booked slots.");
  } catch (error) {
    console.error("Error disabling booked slots:", error);
  }
}
// Helper function to 
function bookSlot() {
    if (!appState.selectedDate) {
        alert("Please select a date first.");
        return;
    }
    if (!appState.slotTime) {
        alert("Please select a time slot first.");
        return;
    }
		const selectedDate = appState.selectedDate;
    const userName = appState.initCustomerInfo.name;
    // Extract month and weekday
    const month = selectedDate.toLocaleString('en-US', { month: 'long' });
    const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
		const date = selectedDate.toLocaleDateString('en-US', { day: 'numeric' }); // Or other format
		const time = appState.slotTime.getHours(); 
		function formatTo12Hour(hour) {
  	const adjustedHour = hour % 12 || 12; // Convert 0 to 12 for midnight
  	const period = hour >= 12 ? "PM" : "AM"; // Determine AM/PM
  	return `${adjustedHour} ${period}`; // Return formatted time
		}
		const hour = formatTo12Hour(time);
		console.log(weekday, month, date, hour);
		appState.bookingData.month = month;
		appState.bookingData.date = date;
		appState.bookingData.weekday = weekday;
		appState.bookingData.hour = hour;
		console.log('appState.bookingData = ', appState.bookingData);
    const confirmation = confirm(
        `Confirm booking for ${userName} on ${weekday}, ${month} ${date} at ${hour}?`
    );
    if (!confirmation) {
        alert("Booking canceled.");
        return;
    }
		appState.newBookingData = {
        day: weekday,
        date: formatDate(selectedDate),
        time: hour,
        dateBooked: formatDate(new Date()),
        available: 'no',
        bookedBy: userName,
        ticketNumber: appState.ticketNumber,
    };
		updateCustomer(appState.newBookingData);
}

async function updateCustomer(newBookingData) {
	const custCheck = await get(appKeys.customerRef());
    const customerUpdate = {
        booked: "yes",
        bookingData: { ...appState.newBookingData },
    };
    console.log('Updating customer with data:', customerUpdate);
    try {
      await update(appKeys.customerRef(), customerUpdate); // Ensure appKeys is accessible here
    } catch (error) {
    	console.error('Failed to update customer:', error.message);
    }
		updateCalendar();
}
async function updateCalendar() {
	try {
		await update(appKeys.bookingRef(), appState.newBookingData);
		console.log("saved customer info to customer db")
	} catch (error) {
		console.error("failed to save customer info to customer db");
		console.error(error.message);
	}
}
async function sendConfirmationEmail() {
  const customerRef = ref(db, `customers/${ticketNumber}`);
  const snapshot = await get(customerRef);
  if (!snapshot.exists()) throw new Error("Lead not found.");
  const newcustomerInfo = snapshot.val();
  try {
    const postmarkTempID = 'confirm-booking';
    const emailPayload = {
      To: newcustomerInfo.email,
      TemplateAlias: postmarkTempID,
      TemplateModel: {
        name: newcustomerInfo.name,
        phone: newcustomerInfo.phone,
        ticketNumber: newcustomerInfo.ticketNumber,
        carMake: newcustomerInfo.carMake,
        carModel: newcustomerInfo.carModel,
        carYear: newcustomerInfo.carYear,
        comments: newcustomerInfo.comments || "None provided",
        submit_date: newcustomerInfo.submitDate,
        booked: newcustomerInfo.bookingData?.status || "No Booking",
        bookingEmail: newcustomerInfo.bookingEmail,
        reviewed: newcustomerInfo.reviewed,
        dateBooked: newcustomerInfo.bookingData?.dateBooked || "N/A",
        bookingDate: newcustomerInfo.bookingData?.date || "N/A",
        bookingTime: newcustomerInfo.bookingData?.time || "N/A",
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
    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`Server error: ${response.statusText}, ${responseBody}`);
    }
		return;
    console.log("Confirmation email sent successfully.");
  } catch (error) {
    console.error("Failed to send confirmation email:", error.message);
    throw error;
  }
}
// Helper functions
const formatDate = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Get month (01-12)
  const day = date.getDate().toString().padStart(2, '0');  // Get day (01-31)
  const year = date.getFullYear();  // Get full year (YYYY)
  let hours = date.getHours();  // Get hour (0-23)
  const minutes = date.getMinutes().toString().padStart(2, '0');  // Get minutes (00-59)
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;  // Convert hour to 12-hour format
  hours = hours ? hours : 12;  // Hour '0' should be '12'
  return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
	};

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
