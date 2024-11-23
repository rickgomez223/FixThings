import { 
  app, 
  database as db, 
  databaseRef as ref, 
  get, 
  set, 
  update 
} from "../../public/src/firebase/FixThings-CustomerAppfirebaseConfig.js";


let jsonData = {}; // Original JSON data
let flatData = {}; // Flattened JSON data
const customerDatabase = ref(db, 'customers/');

// Utility to flatten nested JSON
function flattenJSON(obj, parentKey = '', result = {}) {
  for (const key in obj) {
    const propName = parentKey ? `${parentKey}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenJSON(obj[key], propName, result);
    } else {
      result[propName] = obj[key];
    }
  }
  return result;
}

// Utility to unflatten JSON
function unflattenJSON(flattened) {
  const result = {};
  for (const key in flattened) {
    const keys = key.split('.');
    keys.reduce((acc, part, idx) => {
      if (idx === keys.length - 1) {
        acc[part] = flattened[key];
      } else {
        acc[part] = acc[part] || {};
      }
      return acc[part];
    }, result);
  }
  return result;
}

// Load JSON from file or URL
async function loadJSON() {
  const source = document.getElementById("jsonSource").value.trim();

  if (!source) {
    alert("Please enter a valid file link or URL.");
    return;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to load JSON: ${response.statusText}`);
    const data = await response.json();
    jsonData = data;
    flatData = flattenJSON(jsonData);
    populateTable();
  } catch (error) {
    console.error(error);
    alert("An error occurred while loading the JSON.");
  }
}

// Load JSON from Firebase
async function loadFromFirebase() {
  try {
    const snapshot = await get(customerDatabase);
    if (snapshot.exists()) {
      jsonData = snapshot.val();
      flatData = flattenJSON(jsonData);
      populateTable();
    } else {
      alert("No data found in Firebase.");
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching data from Firebase.");
  }
}

// Save JSON to Firebase
async function saveToFirebase() {
  try {
    jsonData = unflattenJSON(flatData);
    await set(customerDatabase, jsonData);
    alert("Data successfully saved to Firebase!");
  } catch (error) {
    console.error(error);
    alert("An error occurred while saving data to Firebase.");
  }
}

// Populate Table with Flattened JSON Data
function populateTable() {
  const tableBody = document.getElementById("jsonTable").querySelector("tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  Object.keys(flatData).forEach((key) => {
    const row = document.createElement("tr");

    // Key Column
    const keyCell = document.createElement("td");
    keyCell.textContent = key;
    row.appendChild(keyCell);

    // Value Column
    const valueCell = document.createElement("td");
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.value = flatData[key];
    valueInput.addEventListener("change", (e) => updateValue(key, e.target.value));
    valueCell.appendChild(valueInput);
    row.appendChild(valueCell);

    // Actions Column
    const actionsCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteRow(key));
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });
}

// Update a Value
function updateValue(key, newValue) {
  flatData[key] = newValue;
}

// Delete a Row
function deleteRow(key) {
  delete flatData[key];
  populateTable();
}

// Add a New Key-Value Pair
function addRow() {
  const newKey = document.getElementById("newKey").value.trim();
  const newValue = document.getElementById("newValue").value.trim();

  if (!newKey) {
    alert("Key cannot be empty.");
    return;
  }

  flatData[newKey] = newValue;
  document.getElementById("newKey").value = "";
  document.getElementById("newValue").value = "";
  populateTable();
}

// Export JSON
function exportJSON() {
  jsonData = unflattenJSON(flatData);
  const jsonOutput = document.getElementById("jsonOutput");
  jsonOutput.value = JSON.stringify(jsonData, null, 2);
}

// Event Listeners
document.getElementById("loadJSONBtn").addEventListener("click", loadJSON);
document.getElementById("loadFirebaseBtn").addEventListener("click", loadFromFirebase);
document.getElementById("saveFirebaseBtn").addEventListener("click", saveToFirebase);
document.getElementById("addRowBtn").addEventListener("click", addRow);
document.getElementById("exportBtn").addEventListener("click", exportJSON);