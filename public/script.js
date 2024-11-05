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


// Submit the form data to the server
async function submitData(formData) {
  console.log("Submitting data to server:", formData);

  try {
    const response = await fetch("https://formsubmithandler-77757u6a6q-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData })  // Using "formData" to clearly indicate the payload
			console.log(body):
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.message || `Server responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Server response received:", result);

    return result;
  } catch (error) {
    console.error("Network or server error:", error.message);
    alert("There was an issue with the server or your network connection. Please try again later.");
    throw new Error("Submission failed: " + error.message);
  }
}

// Process the server response
function processResponse(result, form) {
  console.log("Processing server response:", result);

  if (result.success) {
    alert(`Submission successful! Your ticket number is ${result.ticketNumber}. Check your email for details.`);
    form.reset();
  } else {
    console.error("Submission failed:", result.message);
    alert("Submission failed: " + result.message);
  }
}

// Collect and validate form data before submitting
function collectFormData() {
  console.log("Collecting form data");
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    carYear: document.getElementById("car-year").value.trim(),
    carMake: document.getElementById("car-make").value.trim(),
    carModel: document.getElementById("car-model").value.trim(),
    carTrim: document.getElementById("car-trim").value.trim(),
    comments: document.getElementById("comments").value.trim(),
  };

  const isValid = data.name && data.email && data.carYear && data.carMake && data.carModel && data.carTrim;
  if (!isValid) {
    console.warn("Validation failed: Missing required fields", data);
    alert("Please fill in all required fields.");
    return null;
  }

  return data;
}

// Main function to handle the form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = collectFormData();

  if (!formData) return;

  try {
    const result = await submitData(formData);
    processResponse(result, form);
  } catch (error) {
    console.error("Failed to submit form:", error);
    alert("Failed to submit your data. Please try again later.");
  }
}






// // Submit the form data to the server
// async function submitData(encryptedData) {
//   log("info", "Submitting data to server", { encryptedData });

//   try {
//     const response = await fetch("https://formsubmithandler-77757u6a6q-uc.a.run.app", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ data: encryptedData }), // Use "data" for clarity
//     });

//     console.log(`HTTP Status: ${response.status} ${response.statusText}`);

//     const result = await response.json();
//     console.log("Response JSON:", result);

//     if (!response.ok) {
//       console.error(`Unexpected server response: ${response.status}`, result);
//       if (response.status === 400) {
//         alert("Bad Request. Please check your input.");
//       } else if (response.status === 500) {
//         alert("Server error. Please try again later.");
//       }
//       throw new Error(`Server returned error status: ${response.status}`);
//     }

//     return result;
//   } catch (error) {
//     console.error("Error parsing response or network issue:", error.message || error);
//     alert("There was a network issue or unexpected response from the server.");
//     throw new Error("There was a network issue or unexpected response from the server.");
//   }
// }

// // Process the server response
// function processResponse(result, form) {
//   log("info", "Processing server response", { result });
//   if (result.success) {
//     console.log("Response processed: Submission success.");
//     alert(`Submission success! Your ticket number is ${result.ticketNumber}. Details in your email!`);
//     form.reset(); // Reset form only on success
//   } else {
//     console.error("Response processed: Submission failed.");
//     alert("Submission failed. Please try again later.");
//   }
// }

// // Collect form data
// function collectFormData() {
//   log("info", "Collecting form data");
//   return {
//     name: document.getElementById("name").value.trim(),
//     email: document.getElementById("email").value.trim(),
//     phone: document.getElementById("phone").value.trim(),
//     carYear: document.getElementById("car-year").value.trim(),
//     carMake: document.getElementById("car-make").value.trim(),
//     carModel: document.getElementById("car-model").value.trim(),
//     carTrim: document.getElementById("car-trim").value.trim(),
//     comments: document.getElementById("comments").value.trim(),
//   };
// }

// // Validate the collected data
// function validateData(data) {
//   log("info", "Validating data");
//   const isValid = data.name && data.email && data.carYear && data.carMake && data.carModel && data.carTrim;
//   if (!isValid) {
//     console.warn("Validation failed: Missing required fields.", data);
//   }
//   return isValid;
// }

// // Fetch the public key
// async function fetchPublicKey(url) {
//   const response = await fetch(url);
//   if (!response.ok) throw new Error("Public key not accessible");
//   const publicKeyPEM = await response.text();
//   return await importPublicKey(publicKeyPEM);
// }

// // Import the public key from PEM format
// async function importPublicKey(pemKey) {
//   const binaryDer = pemToArrayBuffer(pemKey);
//   return await crypto.subtle.importKey(
//     "spki",
//     binaryDer,
//     { name: "RSA-OAEP", hash: "SHA-256" },
//     true,
//     ["encrypt"]
//   );
// }

// // Convert PEM format to ArrayBuffer
// function pemToArrayBuffer(pem) {
//   const base64 = pem
//     .replace(/-----BEGIN PUBLIC KEY-----/g, "")
//     .replace(/-----END PUBLIC KEY-----/g, "")
//     .replace(/\s/g, "");
//   const binaryString = atob(base64);
//   const binaryLen = binaryString.length;
//   const bytes = new Uint8Array(binaryLen);
//   for (let i = 0; i < binaryLen; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// }

// // Encrypt data using the public key
// async function encryptData(data, publicKey) {
//   log("info", "Encrypting data");
//   const encoder = new TextEncoder();
//   const encodedData = encoder.encode(JSON.stringify(data));
//   const encrypted = await crypto.subtle.encrypt(
//     { name: "RSA-OAEP" },
//     publicKey,
//     encodedData
//   );
//   return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
// }

// // Main function to handle the form submission
// // async function handleFormSubmit(event) {
// //   event.preventDefault(); // Prevent the default form submission
  
// //   const form = event.target; // Reference to the form
// //   const formData = collectFormData(); // Collect form data
  
// //   if (!validateData(formData)) {
// //     alert("Please fill in all required fields.");
// //     return;
// //   }

// //   try {
// //     const publicKey = await fetchPublicKey("https://fixthings-db8b0-default-rtdb.firebaseio.com/apiKeys/PUBLIC_KEY.json"); // Replace with the actual URL
// //     const encryptedData = await encryptData(formData, publicKey); // Encrypt the data
// //     const result = await submitData(encryptedData); // Submit the encrypted data to the server
// //     processResponse(result, form); // Process the server response
// //   } catch (error) {
// //     console.error("Submission failed:", error);
// //     alert("There was an error submitting your data. Please try again.");
// //   }
// // }


// // Main function to handle the form submission
// async function handleFormSubmit(event) {
//   event.preventDefault(); // Prevent the default form submission

//   const form = event.target; // Reference to the form
//   const formData = collectFormData(); // Collect form data

//   if (!validateData(formData)) {
//     alert("Please fill in all required fields.");
//     return;
//   }

//   try {
//     // Directly submit data without encryption
//     const result = await submitData(formData); // Submit the unencrypted data to the server
//     processResponse(result, form); // Process the server response
//   } catch (error) {
//     console.error("Submission failed:", error);
//     alert("There was an error submitting your data. Please try again.");
//   }
// }

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


