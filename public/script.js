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
	storage, storageRef, listAll, getDownloadURL
} from "./src/firebase/FixThings-CustomerAppfirebaseConfig.js";
// Global constants
const appData = {
	POSTMARK_Template_URL: "https://api.postmarkapp.com/email/withTemplate",
	apiKeysRef: () => ref(db, "apiKeys"),
	pushcut_key: ref(db, 'apiKeys/PUSHCUT_WEBHOOK_URL'),
	ticketCounter: () => ref(db, 'meta/customerCount'),
	customerRef: (ticketNumber) => ref(db, `customers/${ticketNumber}`),
	ticketCount: () => ref(db, 'meta/customerCount/count'),
	api: "https://fixthings.pro/api/",
	customer: {
		ticketNumber: '',
		selectedService: document.querySelector("#servicesDropdown").value.trim(),
	},
};
// Start
document.addEventListener("DOMContentLoaded", initializeApp);
// DOM elements
const servicesList = document.getElementById("services-list");
const servicesDropdown = document.querySelector("#servicesDropdown");
const pricingTable = document.getElementById("pricing-table");
const aboutMeTxt = document.getElementById("aboutMeTxt");
const carouselSlide = document.querySelector(".carousel-slide");
const carouselImg = document.querySelectorAll(".carousel-slide img");
const pricingTxt = document.getElementById("pricingTxt");
/** Initializes the app */
async function initializeApp() {
  log("info", "Initializing App...");
  try {
    await loadServices();
    await loadAboutMe();
    await loadCarousel();
    await loadPricingText();
    setupEventListeners();
		
  } catch (error) {
    log("error", "App Initialization Failed", error);
  }
}
/** Loads services data and populates the DOM */
async function loadServices() {
  try {
    const services = await fetchJSON("./src/services.json");
    services.forEach((service) => {
      appendServiceToList(service);
      appendServiceToPricingTable(service);
      addToDropdown(service);
    });
  } catch (error) {
    log("error", "Failed to load services", error);
  }
}
/** Appends a service to the services dropdown */
function addToDropdown(service) {
  const option = document.createElement("option");
  option.value = service.service_name; // Fixed key
  option.textContent = service.service_name; // Fixed key
  servicesDropdown.appendChild(option);
}
/** Appends a service to the services list */
function appendServiceToList(service) {
  if (service.service_name === "Something Else") {
    return; // Skip "Something Else"
  }

  const listItem = document.createElement("li");
  listItem.textContent = service.service_name; // Add the service name
  servicesList.appendChild(listItem);
}
/** Appends a service to the pricing table */
function appendServiceToPricingTable(service) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><a href="#">${service.service_name}</a></td> <!-- Fixed key -->
    <td>$${service.price.toFixed(2)}</td> <!-- Added formatting -->
    <td>${service.description}</td>
  `;
  row.querySelector("a").addEventListener("click", (e) => showServicePopup(e, service));
  pricingTable.querySelector("tbody").appendChild(row);
}
/** Shows a popup with service details */
function showServicePopup(event, service) {
  event.preventDefault();
  const popup = document.getElementById("service-details-popup");
  const closeButton = popup.querySelector(".close-button");
  // Set the content of the popup
  popup.querySelector("h2").textContent = service.service_name;
  popup.querySelector("p:nth-child(3)").textContent = service.description;
  const expenseList = popup.querySelector("ul");
  expenseList.innerHTML = service.expenses
    .map((expense) => `<li>${expense.name}: $${expense.cost.toFixed(2)}</li>`)
    .join("");
  // Show the popup
  popup.classList.remove("hidden"); 
  // Close the popup when the close button is clicked
  closeButton.addEventListener("click", () => {
    popup.classList.add("hidden");
  });
  // Close the popup when clicking outside of it
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !event.target.closest(".servicePopup")) {
      popup.classList.add("hidden");
    }
  });
}
/** Loads "About Me" text */
async function loadAboutMe() {
  try {
    const text = await fetchText("./src/aboutMe.txt");
    aboutMeTxt.textContent = text;
  } catch (error) {
    log("error", "Failed to load About Me text", error);
  }
}
// Carousel variables
let counter = 0; // Tracks the current slide
let carouselImages = []; // Stores the image URLs


/** Loads the image carousel dynamically from Firebase Storage */
async function loadCarousel() {
  try {
    // Ensure carouselSlide is initialized
    if (!carouselSlide) {
      throw new Error("carouselSlide element not found");
    }

    const imagesListRef = storageRef(storage, "site/images/banner"); // Adjust path as needed
    const res = await listAll(imagesListRef); // Get a list of all files in the folder

    if (res.items.length === 0) {
      // No images found
      hideCarousel(); // Hide the carousel if no images are found
      console.log("No images found in Firebase Storage. Hiding carousel.");
      return;
    }

    // Get download URLs for all images
    const imageUrls = await Promise.all(
      res.items.map((itemRef) => getDownloadURL(itemRef))
    );

    if (imageUrls.length === 0) {
      hideCarousel(); // Hide the carousel if no valid image URLs are found
      console.log("No valid image URLs found. Hiding carousel.");
      return;
    }

    carouselImages = imageUrls; // Store the image URLs
    carouselSlide.innerHTML = ""; // Clear existing images

    // Append new images to the carousel
    carouselImages.forEach((url, index) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Carousel Image";
      img.style.objectFit = "cover"; // Ensure consistent sizing
      img.style.position = "absolute"; // Stack images on top of each other
      img.style.top = 0;
      img.style.left = 0;
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.display = index === 0 ? "block" : "none"; // Only show the first image initially
      carouselSlide.appendChild(img);
    });

    showCarousel(); // Show the carousel once images are loaded

    // Start carousel auto-slide
    setInterval(() => {
      if (carouselImages.length === 0) return;
      toggleImages(); // Toggle images every 5 seconds
    }, 5000);

    // Set up cycle button functionality
    setupCycleButtons();
    
  } catch (error) {
    console.error(`Failed to load carousel: ${error.message}`);
    hideCarousel(); // Hide carousel if an error occurs
  }
}

/** Show the carousel */
function showCarousel() {
  carouselSlide.style.display = "block"; // or 'flex' if you want flexbox behavior
}

/** Hide the carousel */
function hideCarousel() {
  carouselSlide.style.display = "none";
}

/** Toggles the visibility of the images */
function toggleImages() {
  const images = carouselSlide.getElementsByTagName("img");

  // Hide the current image
  images[counter].style.display = "none";

  // Increment the counter (move to the next image)
  counter = (counter + 1) % carouselImages.length;

  // Show the next image
  images[counter].style.display = "block";
}

/** Set up the cycle buttons for manual navigation */
function setupCycleButtons() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");

  if (nextBtn) {
    nextBtn.addEventListener("click", nextImage); // Next button cycles to next image
  } else {
    console.warn("Next button not found");
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", prevImage); // Previous button cycles to previous image
  } else {
    console.warn("Previous button not found");
  }
}

/** Advances to the next image in the carousel */
function nextImage() {
  if (carouselImages.length === 0) return;
  // Hide the current image
  const images = carouselSlide.getElementsByTagName("img");
  images[counter].style.display = "none";

  // Increment counter (move to the next image)
  counter = (counter + 1) % carouselImages.length;

  // Show the next image
  images[counter].style.display = "block";
}

/** Moves to the previous image in the carousel */
function prevImage() {
  if (carouselImages.length === 0) return;
  // Hide the current image
  const images = carouselSlide.getElementsByTagName("img");
  images[counter].style.display = "none";

  // Decrement counter (move to the previous image)
  counter = (counter - 1 + carouselImages.length) % carouselImages.length;

  // Show the previous image
  images[counter].style.display = "block";
}
/** Loads pricing text */
async function loadPricingText() {
  try {
    const text = await fetchText("./src/pricing.txt");
    pricingTxt.textContent = text;
  } catch (error) {
    log("error", "Failed to load pricing text", error);
  }
}
/** Sets up event listeners */
function setupEventListeners() {
  document.getElementById("contact-form").addEventListener("submit", handleFormSubmit);
}
/** Handles form submission */
async function handleFormSubmit(event) {
  event.preventDefault();
  const submitButton = document.getElementById("submit");
  const setButtonState = (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    submitButton.innerText = isSubmitting ? "Submitting..." : "Submit";
  };
  setButtonState(true); // Disable
  try {
    const formData = await collectFormData();
    if (!formData) return;
		await prepareCustomerData(formData);
		await sendConfirmationEmail(formData);
    await sendPushcutNotification(formData);
    document.getElementById("contact-form").reset();
    alert("Thank you for your submission!");
  } catch (error) {
    console.error("Form submission failed", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setButtonState(false); // Re-enable
  }
}
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
/** Collects and validates form data */
async function collectFormData() {
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    carYear: document.getElementById("car-year").value.trim(),
    carMake: document.getElementById("car-make").value.trim(),
    carModel: document.getElementById("car-model").value.trim(),
    carTrim: document.getElementById("car-trim").value.trim(),
    comments: document.getElementById("comments").value.trim(),
		service: document.querySelector("#servicesDropdown")?.value.trim(),
    submitDate: formatDate(new Date()),  
		reviewed: 'no',
		status: 'unreviewed', 
		statusOptions: {
			0: 'init',
			1: 'unreviewed',
			2: 'review-denied',
			3: 'review-pending',
			4: 'review-accepted',
			5: 'unbooked',
			6: 'booked',
			7: 'pending-customer',
			8: 'booking-cancelled',
			9: 'booking-reschedule-pending',
			10: 'current',
			11: 'finished',
			12: 'pending',
			13: 'error',
		},
		linkExpire: 'no',
		booking: {
			bookingLink: 'no',
			bookingEmail: 'no',
			booked: 'no',
		},
		
  };
  // Check if required fields are filled
  if ( !data.name || !data.email || !data.phone || !data.carYear || !data.carMake || !data.carModel || !data.service ) {
    alert("Please fill in all required fields.");
    return null;
  }
  // Validate phone number (optional, but if filled, it should be a valid phone number)
  if (data.phone && !/^\d{10}$/.test(data.phone)) {
    alert("Please enter a valid phone number (10 digits).");
    return null;
  }
  // Validate car year (ensure it's a 4-digit number)
  if (!/^\d{4}$/.test(data.carYear)) {
    alert("Please enter a valid car year (4 digits).");
    return null;
  }

  return data;
}
/** Fetches the current customer count */
async function getCustomerCount() {
  try {
	  const snapshot = await get(appData.ticketCount());
	  if (!snapshot.exists()) {
	    console.warn("Customer count not found in DB; returning default.");
	    return 0;
	  }
	  return snapshot.val();
	} catch (error) {
	  console.error("Failed to fetch customer count:", error);
	  return 0;  // Fallback to prevent cascading errors
	}
}

/** Prepares customer data and increments ticket count */
async function prepareCustomerData(formData) {
  try {
    // Increment from last customer and assign to this customer
    appData.customer.ticketNumber = await getCustomerCount() + 1;
    console.log("Incremented ticket number " + appData.customer.ticketNumber);
    formData.ticketNumber = appData.customer.ticketNumber;
    try {
      // Set the customer data in the database
      await set(appData.customerRef(appData.customer.ticketNumber), formData);
      console.log("Customer data set successfully.");
      // Update ticket counter
      try {
        await update(appData.ticketCounter(), { count: appData.customer.ticketNumber });
        console.log("Ticket counter updated successfully.");
      } catch (updateError) {
        console.error("Error updating ticket counter: " + updateError.message);
      }
    } catch (error) {
      console.error("Error updating customer info: " + error.message);
    }
    return formData;
  } catch (error) {
    console.log("Error: Failed to prepare customer data", error.message);
    throw error;  // Rethrow for further handling if needed
  }
}
/** Fetches Pushcut webhook URL from Firebase */
async function getPushcutWebhookUrl() {
  const snapshot = await get(appData.pushcut_key);
  console.log("pushcut url is: " + snapshot.val());
  if (!snapshot.exists()) {
    throw new Error("Pushcut webhook URL not found in the database.");
  }
  return snapshot.val();
}

/** Sends a notification via Pushcut */
async function sendPushcutNotification(customerData) {
  try {
    const pushcutWebhookUrl = await getPushcutWebhookUrl();
    let retryAttempts = 3;
    let success = false;
    while (retryAttempts > 0 && !success) {
      try {
        const response = await fetch(pushcutWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `🚗 New FixThings Customer Lead - #${customerData.ticketNumber}`,
            text: `Name:\n${customerData.name}\n\n` +
                  `Email:\n${customerData.email}\n\n` +
                  `Phone:\n${customerData.phone}\n\n` +
                  `Vehicle:\n${customerData.carYear} ${customerData.carMake} ${customerData.carModel} (${customerData.carTrim})\n\n` +
                  `Comments:\n${customerData.comments}\n\n` +
                  `Service:\n${customerData.service}\n\n` +
                  `Submission Date:\n${customerData.submitDate}\n\n`,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`);
        }
        log("info", "Sent Pushcut notification");
        success = true;  // Success, break the loop
      } catch (error) {
        retryAttempts--;
        console.error(`Error sending Pushcut notification. Retries left: ${retryAttempts}`);
        if (retryAttempts === 0) {
          console.error("Failed to send Pushcut notification after multiple attempts.");
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));  // Retry after 2 seconds
        }
      }
    }
  } catch (error) {
    log("error", "Failed to send Pushcut notification", error);
    throw error;
  }
}

/** Sends a confirmation email */
async function sendConfirmationEmail(customerData) {
  try {
    const postmarkTempID = 'signup-email';
    if (!postmarkTempID) {
      throw new Error("Postmark Template ID is missing.");
    }
    const emailPayload = {
      To: customerData.email,
      TemplateAlias: postmarkTempID,
      TemplateModel: {
        name: customerData.name,
        phone: customerData.phone,
        ticketNumber: customerData.ticketNumber,
        carMake: customerData.carMake,
        carModel: customerData.carModel,
        carYear: customerData.carYear,
        comments: customerData.comments || "None provided",
        service: customerData.service,
        submit_date: customerData.submitDate,
      },
      MessageStream: "customer-leads",
    };
    let retryAttempts = 3;
    let success = false;
    while (retryAttempts > 0 && !success) {
      try {
        const response = await fetch(appData.api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
          mode: 'cors',
        });
        const responseBody = await response.text();
        if (!response.ok) {
          log("error", `Server error ${response.status}: ${responseBody}`, {
            status: response.status,
            responseBody,
          });
          throw new Error(`Server error: ${response.statusText}`);
        }
        log("info", "Confirmation email sent successfully", { responseBody });
        success = true;  // Success, break the loop
      } catch (error) {
        retryAttempts--;
        console.error(`Error sending confirmation email. Retries left: ${retryAttempts}`);
        if (retryAttempts === 0) {
          console.error("Failed to send confirmation email after multiple attempts.");
        } else {
          // Retry after 2 seconds (or you can extend the delay if needed)
          console.log("Retrying in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    if (!success) {
      throw new Error("Failed to send the confirmation email after multiple retries.");
    }
  } catch (error) {
    if (error.name === "TypeError") {
      // Likely a network or CORS issue
      log("error", "Fetch error, possibly network or CORS related", {
        message: error.message,
      });
    } else {
      // Generic or server error
      log("error", "Failed to send confirmation email", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}
// Helper Functions
/** Fetches JSON from a URL */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}`);
  }
	console.log("fetchJSON Helper ran");
  return response.json();
}
/** Fetches plain text from a URL */
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch text from ${url}`);
  }
	console.log("fetchText Helper ran");
  return response.text();
}
// /** Logs messages for debugging */
// function log(level, ...messages) {
//   console[level](...messages);
// }
//
//
//            Do Not Touch.            
//
//
// Logging function
function log(type, message, data = {}) {
  const allowedTypes = ["log", "warn", "error", "info"];
  const logEntry = `[${new Date().toISOString()}] ${message}`;

  if (allowedTypes.includes(type)) {
    console[type](logEntry, data);
  } else {
    console.error(`[${new Date().toISOString()}] Invalid log type: ${type}`, { data });
  }
}
// // Debugging function with button creation at the bottom of the script
// (function () {
//   // Function to auto-fill and submit the form with sample data
//   function autoFillFormAndSubmit() {
//     // Define sample data
//     const sampleData = {
//       name: "Kyle Martinez",
//       email: "rickgomez223@gmail.com",
//       phone: "1234567890",
//       carYear: "2014",
//       carMake: "Chevy",
//       carModel: "Cruze",
//       carTrim: "Eco",
//       comments: "Debugging form submission",
//     };
//     // Fill out the form fields with sample data
//     document.getElementById("name").value = sampleData.name;
//     document.getElementById("email").value = sampleData.email;
//     document.getElementById("phone").value = sampleData.phone;
//     document.getElementById("car-year").value = sampleData.carYear;
//     document.getElementById("car-make").value = sampleData.carMake;
//     document.getElementById("car-model").value = sampleData.carModel;
//     document.getElementById("car-trim").value = sampleData.carTrim;
//     document.getElementById("comments").value = sampleData.comments;

//     // Log sample data for debugging
//     log("info", "Auto-filled form with sample data:", sampleData);
//   }
//   // Create a button to trigger the debugging function
//   const debugButton = document.createElement("button");
//   debugButton.textContent = "Auto-Fill Form and Submit";
//   debugButton.style.position = "fixed";
//   debugButton.style.top = "150px";
//   debugButton.style.right = "10px";
//   debugButton.onclick = autoFillFormAndSubmit;
//   document.body.appendChild(debugButton);
// })();



