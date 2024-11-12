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
const POSTMARK_Template_URL = "https://api.postmarkapp.com/email/withTemplate";
// API keys paths
const apiKeysRef = ref(db, "apiKeys");

/** Fetches Pushcut webhook URL from Firebase */
async function getPushcutWebhookUrl() {
  const snapshot = await get(ref(db, 'apiKeys/PUSHCUT_WEBHOOK_URL'));
  if (!snapshot.exists()) {
    throw new Error("Pushcut webhook URL not found in the database.");
  }
  return snapshot.val();
}
// DOM elements
const servicesList = document.getElementById("services-list");
const pricingTable = document.getElementById("pricing-table");
const aboutMeTxt = document.getElementById("aboutMeTxt");
const carouselSlide = document.querySelector(".carousel-slide");
const carouselImages = document.querySelectorAll(".carousel-slide img");
const pricingTxt = document.getElementById("pricingTxt");

// Carousel variables
let counter = 0;


document.addEventListener("DOMContentLoaded", initializeApp);

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
/** Appends a service to the services list */
function addToDropdown(service) {
	const servicesDropdown = document.querySelector("#servicesDropdown");
  const option = document.createElement("option");
      option.value = service.name; 
      option.textContent = service.name; 
      servicesDropdown.appendChild(option);
}
/** Appends a service to the services list */
function appendServiceToList(service) {
  const listItem = document.createElement("li");
  listItem.textContent = service.name;
  servicesList.appendChild(listItem);
}

/** Appends a service to the pricing table */
function appendServiceToPricingTable(service) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><a href="#">${service.name}</a></td>
    <td>${service.price}</td>
    <td>${service.description}</td>
  `;
  row.querySelector("a").addEventListener("click", (e) => showServicePopup(e, service));
  pricingTable.querySelector("tbody").appendChild(row);
}

/** Shows a popup with service details */
function showServicePopup(event, service) {
  event.preventDefault();
  const popup = document.getElementById("service-details-popup");
  popup.querySelector("h2").textContent = service.name;
  popup.querySelector("p:nth-child(3)").textContent = service.description;
  
  const expenseList = popup.querySelector("ul");
  expenseList.innerHTML = service.expenses
    .map((expense) => `<li>${expense.name}: $${expense.cost}</li>`)
    .join("");

  popup.classList.remove("hidden");
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target)) popup.classList.add("hidden");
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

/** Loads the image carousel dynamically from Firebase Storage */
// Carousel variables

let size = 0; // Width of each carousel item (in pixels)

// Loads the image carousel dynamically from Firebase Storage
async function loadCarousel() {
  try {
    // Ensure carouselSlide is initialized
    if (!carouselSlide) {
      throw new Error('carouselSlide element not found');
    }

    const imagesListRef = storageRef(storage, 'site/images/banner'); // Adjust path as needed
    const res = await listAll(imagesListRef); // Get a list of all files in the "carousel-images" folder

    // If there are no items in the folder
    if (res.items.length === 0) {
      // No images found, hide the carousel
      carouselSlide.style.display = 'none';
      log("info", "No images found in Firebase Storage. Hiding carousel.");
      return; // Exit the function early since there are no images to show
    }

    // Get download URLs for each image file in the folder
    const imageUrls = await Promise.all(res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef); // Get the download URL for each image
      return url;
    }));

    // If imageUrls is empty after fetching, hide the carousel
    if (imageUrls.length === 0) {
      carouselSlide.style.display = 'none';
      log("info", "No valid image URLs found. Hiding carousel.");
      return;
    }

    // Now `imageUrls` contains the list of image URLs from Firebase Storage
    carouselImages = imageUrls; // Set the carousel images to the URLs fetched

    // Clear the existing images from the carousel (if any)
    carouselSlide.innerHTML = "";

    // Append images to the carousel
    carouselImages.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Carousel Image";
      img.onload = () => {
        // Calculate the width of the image and set it as the size
        if (!size) size = img.width; // Get the width of the first image
      };
      carouselSlide.appendChild(img);
    });

    // Set up carousel functionality (auto-slide every 3 seconds)
    setInterval(() => {
      if (carouselImages.length === 0) return; // No images to slide
      counter = (counter + 1) % carouselImages.length;
      carouselSlide.style.transform = `translateX(${-size * counter}px)`;
    }, 3000);

    // Add event listeners for Next and Back buttons
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");

    // Check if the buttons exist
    if (nextBtn) {
      nextBtn.addEventListener("click", nextImage);
    } else {
      throw new Error("Next button not found");
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", prevImage);
    } else {
      throw new Error("Previous button not found");
    }

  } catch (error) {
    // Handle errors and log them with more details
    log("error", `Failed to load carousel: ${error.message}`, error);
  }
}

// Advances the carousel to the next image
function nextImage() {
  if (carouselImages.length === 0) return; // If no images, do nothing
  counter = (counter + 1) % carouselImages.length; // Go to the next image, loop back if at the end
  carouselSlide.style.transform = `translateX(${-size * counter}px)`;
}

// Moves the carousel to the previous image
function prevImage() {
  if (carouselImages.length === 0) return; // If no images, do nothing
  counter = (counter - 1 + carouselImages.length) % carouselImages.length; // Go to the previous image, loop back if at the beginning
  carouselSlide.style.transform = `translateX(${-size * counter}px)`;
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
  submitButton.disabled = true;  // Disable submit button to prevent multiple submissions
  submitButton.innerText = "Submitting...";  // Update button text

  try {
    const formData = collectFormData();
    if (!formData) return;

    const customerData = await prepareCustomerData(formData);
    const notificationResponse = await sendPushcutNotification(customerData);

    // Send confirmation email using Postmark
    await sendConfirmationEmail(customerData);
    
    // Success: Reset form and show success message
    document.getElementById("contact-form").reset();
    alert("Thank you for your submission! We'll get in touch shortly.");
    
  } catch (error) {
    log("error", "Form submission failed", error);
    alert("Something went wrong. Please try again later.");
  } finally {
    submitButton.disabled = false;  // Re-enable submit button
    submitButton.innerText = "Submit";  // Reset button text
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
function collectFormData() {
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    carYear: document.getElementById("car-year").value.trim(),
    carMake: document.getElementById("car-make").value.trim(),
    carModel: document.getElementById("car-model").value.trim(),
    carTrim: document.getElementById("car-trim").value.trim(),
    comments: document.getElementById("comments").value.trim(),
    submitDate: formatDate(new Date()),  // Returns something like "11-12-2024 03:45 PM"
		booked: 'no',
		bookingEmail: 'no',
		reviewed: 'no',
		
  };

  // Check if required fields are filled
  if (!data.name || !data.email || !data.phone || !data.carYear || !data.carMake || !data.carModel) {
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

/** Prepares customer data and increments ticket count */
async function prepareCustomerData(formData) {
  try {
    const ticketNumber = await getCustomerCount() + 1;
    formData.ticketNumber = ticketNumber;

    await update(ref(db, 'meta/customerCount'), { count: ticketNumber });
    await set(ref(db, `customers/${ticketNumber}`), formData);

    return formData;
  } catch (error) {
    log("error", "Failed to prepare customer data", error);
    throw error;
  }
}

/** Fetches the current customer count */
async function getCustomerCount() {
  const snapshot = await get(ref(db, 'meta/customerCount/count'));
  if (!snapshot.exists()) {
    return 0;
  }
  return snapshot.val();
}

/** Sends a notification via Pushcut */
async function sendPushcutNotification(customerData) {
  try {
    const pushcutWebhookUrl = await getPushcutWebhookUrl();

    const response = await fetch(pushcutWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `🚗 New Customer Lead - Ticket #${customerData.ticketNumber}`,
        text: `**Name:** ${customerData.name}\n\n` +
              `**Email:** [${customerData.email}](mailto:${customerData.email})\n\n` +
              `**Phone:** [${customerData.phone}](tel:${customerData.phone})\n\n` +
              `**Vehicle:** ${customerData.carYear} ${customerData.carMake} ${customerData.carModel} (${customerData.carTrim})\n\n` +
              `**Comments:**\n${customerData.comments || "_No comments provided_"}\n\n` +
              `***Submission Date:***\n${customerData.submitDate}\n\n`
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    log("info", "Sent Pushcut notification");
  } catch (error) {
    log("error", "Failed to send Pushcut notification", error);
    throw error;
  }
}

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
        submit_date: customerData.submitDate,
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
      log("error", `Server error ${response.status}: ${responseBody}`, {
        status: response.status,
        responseBody,
      });
      throw new Error(`Server error: ${response.statusText}`);
    }

    log("info", "Confirmation email sent successfully", { responseBody });
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
// /** Logs messages for debugging */
// function log(level, ...messages) {
//   console[level](...messages);
// }

/** Fetches JSON from a URL */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}`);
  }
  return response.json();
}

/** Fetches plain text from a URL */
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch text from ${url}`);
  }
  return response.text();
}
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
// Debugging function with button creation at the bottom of the script
(function () {
  // Function to auto-fill and submit the form with sample data
  function autoFillFormAndSubmit() {
    // Define sample data
    const sampleData = {
      name: "Kyle Martinez",
      email: "rickgomez223@gmail.com",
      phone: "1234567890",
      carYear: "2014",
      carMake: "Chevy",
      carModel: "Cruze",
      carTrim: "Eco",
      comments: "Debugging form submission",
    };

    // Fill out the form fields with sample data
    document.getElementById("name").value = sampleData.name;
    document.getElementById("email").value = sampleData.email;
    document.getElementById("phone").value = sampleData.phone;
    document.getElementById("car-year").value = sampleData.carYear;
    document.getElementById("car-make").value = sampleData.carMake;
    document.getElementById("car-model").value = sampleData.carModel;
    document.getElementById("car-trim").value = sampleData.carTrim;
    document.getElementById("comments").value = sampleData.comments;

    // Log sample data for debugging
    log("info", "Auto-filled form with sample data:", sampleData);

    // Submit the form
    document.getElementById("contact-form").dispatchEvent(new Event("submit"));
  }

  // Create a button to trigger the debugging function
  const debugButton = document.createElement("button");
  debugButton.textContent = "Auto-Fill Form and Submit";
  debugButton.style.position = "fixed";
  debugButton.style.top = "150px";
  debugButton.style.right = "10px";
  debugButton.onclick = autoFillFormAndSubmit;
  document.body.appendChild(debugButton);
})();



