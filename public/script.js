// Your main JS file

import {
  app,
  database as db,
  ref,
  set,
  get,
  child,
  update,
} from "./src/firebase/FixThings-CustomerAppfirebaseConfig.js";

document.addEventListener("DOMContentLoaded", () => {
  log("info", "DOMContentLoaded");

  initializeApp();
});

async function initializeApp() {
  log("info", "App Initialization Started");
  try {
    await loadServices(); // Includes populateServicesDropdown
    await loadAboutMe();
    await loadCarousel();
    await loadPricingText();

    startApp();
  } catch (error) {
    log("warn", "App Initialization Failed");
    log("error", error);
  }
}

async function loadServices() {
  try {
    const servicesList = document.getElementById("services-list");
    const pricingTable = document.getElementById("pricing-table");
    const response = await fetch("./src/services.json");
    if (!response.ok)
      throw new Error(`Failed to load services.json: ${response.statusText}`);

    const services = await response.json();
    services.forEach((service) => {
      appendServiceToList(servicesList, service);
      appendServiceToPricingTable(pricingTable, service);
    });
  } catch (error) {
    log("error", "Failed to load services JSON");
    log("error", error);
  }
}

function appendServiceToList(servicesList, service) {
  const listItem = document.createElement("li");
  listItem.textContent = service.name;
  listItem.classList.add("service-item");
  servicesList.appendChild(listItem);
}

function appendServiceToPricingTable(pricingTable, service) {
  const tableRow = document.createElement("tr");

  const serviceNameCell = document.createElement("td");
  const serviceLink = document.createElement("a");
  serviceLink.href = "#";
  serviceLink.textContent = service.name;
  serviceNameCell.appendChild(serviceLink);

  const priceCell = document.createElement("td");
  priceCell.textContent = `${service.price.replace("$", "")}`;

  const descriptionCell = document.createElement("td");
  descriptionCell.textContent = service.description;

  tableRow.append(serviceNameCell, priceCell, descriptionCell);
  pricingTable.querySelector("tbody").appendChild(tableRow);

  serviceLink.addEventListener("click", (event) =>
    showServicePopup(event, service),
  );
}

function showServicePopup(event, service) {
  event.preventDefault();
  const popup = document.getElementById("service-details-popup");
  popup.querySelector("h2").textContent = service.name;
  popup.querySelector("p:nth-child(3)").textContent = service.description;

  const expenseList = popup.querySelector("ul");
  expenseList.innerHTML = "";
  service.expenses.forEach((expense) => {
    const expenseItem = document.createElement("li");
    expenseItem.textContent = `${expense.name}: $${expense.cost}`;
    expenseList.appendChild(expenseItem);
  });

  popup.classList.remove("hidden");
  document.addEventListener("click", (event) => {
    if (!popup.contains(event.target)) popup.classList.add("hidden");
  });
}

async function loadAboutMe() {
  try {
    const aboutMeTxt = document.getElementById("aboutMeTxt");
    const response = await fetch("./src/aboutMe.txt");
    if (!response.ok)
      throw new Error(`Failed to load aboutMe.txt: ${response.statusText}`);
    aboutMeTxt.textContent = await response.text();
  } catch (error) {
    log("error", "Failed to load aboutMe.txt");
    log("error", error);
  }
}

async function loadCarousel() {
  try {
    const carouselSlide = document.querySelector(".carousel-slide");
    const carouselImages = document.querySelectorAll(".carousel-slide img");
    let counter = 0;
    const size = carouselImages[0].clientWidth;

    setInterval(() => {
      counter = counter >= carouselImages.length - 1 ? -1 : counter;
      carouselSlide.style.transition = "transform 0.4s ease-in-out";
      carouselSlide.style.transform = `translateX(${-size * ++counter}px)`;
    }, 3000);
  } catch (error) {
    log("error", "Failed to load carousel");
    log("error", error);
  }
}

async function loadPricingText() {
  try {
    const pricingTxt = document.getElementById("pricingTxt");
    const response = await fetch("./src/pricing.txt");
    if (!response.ok)
      throw new Error(`Failed to load pricing.txt: ${response.statusText}`);
    pricingTxt.textContent = await response.text();
  } catch (error) {
    log("error", "Failed to load pricing.txt");
    log("error", error);
  }
}

async function startApp() {
  log("info", "App Started");
  try {
    // Event listeners to handle form submissions

    document
      .getElementById("contact-form")
      .addEventListener("submit", handleFormSubmit);
  } catch (error) {
    log("warn", "App Start Failed");
    log("error", error);
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;

  // Collect and validate form data
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const carYear = document.getElementById("car-year").value;
  const carMake = document.getElementById("car-make").value;
  const carModel = document.getElementById("car-model").value;
  const carTrim = document.getElementById("car-trim").value;
  const comments = document.getElementById("comments").value;

  if (!(name && email && carYear && carMake && carModel && carTrim)) {
    alert("Please provide your name, email & the complete vehicle information.");
    return;
  }

  // Prepare data object
  const data = {
    name,
    email,
    phone,
    carYear,
    carMake,
    carModel,
    carTrim,
    comments,
  };

  try {
    // Step 1: Retrieve the public key
    const pubKeyResponse = await fetch("./src/fixthings-webencrypt.pub");
    const publicKeyPEM = await pubKeyResponse.text();
    const publicKey = await importPublicKey(publicKeyPEM);

    // Step 2: Encrypt the data
    const encryptedData = await encryptData(data, publicKey);

    // Step 3: Send encrypted data to server
    const response = await fetch("/api/formSubmit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedData }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(`Submission success! Your ticket number is ${result.ticketNumber}. Details in your email!`);
      form.reset();
    } else {
      alert("Submission failed. Please try again later.");
    }
  } catch (error) {
    console.error("Error during form submission:", error);
    alert("There was an issue with submission. Please try again later.");
  }
}

// Helper function to import the public key
async function importPublicKey(pemKey) {
  const binaryDer = str2ab(pemKey); // Convert PEM to ArrayBuffer
  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// Helper function to encrypt data using the public key
async function encryptData(data, publicKey) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted))); // Convert to Base64
}

// Helper function to convert PEM to ArrayBuffer
function str2ab(pem) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i);
  }
  return buffer;
}

// Logging function

function log(type, message, data = {}) {
  const allowedTypes = ["log", "warn", "error", "info"];

  // Format the log entry with a timestamp and message
  const logEntry = `[${new Date().toISOString()}] ${message}`;

  // Check if the log type is valid
  if (allowedTypes.includes(type)) {
    console[type](logEntry, data); // Log the message along with additional data if provided
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
      name: "Kyle Fixit",
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


