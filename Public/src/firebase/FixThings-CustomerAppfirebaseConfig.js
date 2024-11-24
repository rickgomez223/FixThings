// Import only the necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as databaseRef, set, get, child, update, remove, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytes, getBlob } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVmGmDDjl5GJl3x5RmJMynb4MCXKQLVQg",
  authDomain: "fixthings-db8b0.firebaseapp.com",
  databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com",
  projectId: "fixthings-db8b0",
  storageBucket: "fixthings-db8b0.appspot.com",
  messagingSenderId: "829720853067",
  appId: "1:829720853067:web:a85ebf7b499e108f382bce",
  measurementId: "G-CBE8M6V0TL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Database
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
// Export initialized services for use in other parts of your app
export {
  app,
  auth,
  database,
  databaseRef,
  set,
  get,
  child,
  update,
	remove,
  sendEmailVerification,
	storage,
	storageRef, 
	listAll, 
	getDownloadURL,
	onValue,
	uploadBytes,
	getBlob,
};







// // Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
// // import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
// // import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
// import { getAuth, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// // import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
// import {
//   getDatabase,
//   ref,
//   set,
//   get,
//   child,
//   update,
// } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
// // import { getMessaging } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js";
// // import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";
// // import { getPerformance } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-performance.js";
// // import { getRemoteConfig } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-remote-config.js";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCVmGmDDjl5GJl3x5RmJMynb4MCXKQLVQg",
//   authDomain: "fixthings-db8b0.firebaseapp.com",
//   databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com",
//   projectId: "fixthings-db8b0",
//   storageBucket: "fixthings-db8b0.appspot.com",
//   messagingSenderId: "829720853067",
//   appId: "1:829720853067:web:a85ebf7b499e108f382bce",
//   measurementId: "G-CBE8M6V0TL",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// // const analytics = getAnalytics(app);
// // const firestore = getFirestore(app);
// const auth = getAuth(app);
// // const storage = getStorage(app);
// const database = getDatabase(app);
// // const messaging = getMessaging(app);
// // const functions = getFunctions(app);
// // const performance = getPerformance(app);
// // const remoteConfig = getRemoteConfig(app);

// // Export the initialized services
// // export { app, analytics, firestore, auth, storage, database, messaging, functions, performance, remoteConfig };
// export {
// 	app,
//   database,
//   ref,
//   set,
//   get,
//   child,
//   update, 
// 	getAuth,
// 	sendEmailVerification 
// };
