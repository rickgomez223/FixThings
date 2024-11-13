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

const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('ticketId');

if (ticketId) {
  console.log("Ticket ID found:", ticketId);
} else {
  console.log("No ticket ID parameter found.");
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
// Month navigation buttons
const nextMonthBtn = document.querySelector('#nextMonthBtn');
const prevMonthBtn = document.querySelector('#prevMonthBtn');
nextMonthBtn.addEventListener("click", () => changeMonth(+1));
prevMonthBtn.addEventListener("click", () => changeMonth(-1));

const nextDayBtn = document.querySelector('#nextDayBtn');
const prevDayBtn = document.querySelector('#prevDayBtn');
nextDayBtn.addEventListener("click", () => changeDay(+1));
prevDayBtn.addEventListener("click", () => changeDay(-1));

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

let bookingData = [];  // Define globally to store the slots data
function renderBookingSlots() {
  const bookingSlots = document.getElementById("bookingSlots");
  bookingSlots.innerHTML = '';

  for (let hour = 9; hour < 17; hour++) {
    const slot = document.createElement('div');
    const slotTime = new Date(selectedDate);
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

function bookSlot(hour) {
  const slotTime = new Date(selectedDate);
  slotTime.setHours(hour);
  slotTime.setMinutes(0);

  const userName = prompt(`Enter your name for the booking at ${slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:`);
  if (!userName) {
    alert("Booking cancelled.");
    return;
  }

  const userContact = prompt("Enter your contact number:");
  if (!userContact) {
    alert("Booking cancelled.");
    return;
  }

  const formattedDate = selectedDate.toISOString().split('T')[0];
  const bookingRef = ref(db, `bookings/${formattedDate}/${hour}`);

  const bookingData = {
    available: false,
    bookedBy: userName,
    contact: userContact,
    time: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  update(bookingRef, bookingData)
    .then(() => {
      alert(`Booking confirmed for ${userName} at ${slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      renderBookingSlots();
    })
    .catch((error) => {
      console.error("Error updating booking data: ", error);
      alert("Failed to complete the booking. Please try again.");
    });
}

renderCalendar();

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