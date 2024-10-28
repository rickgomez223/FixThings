// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVmGmDDjl5GJl3x5RmJMynb4MCXKQLVQg",
  authDomain: "fixthings-db8b0.firebaseapp.com",
  databaseURL: "https://fixthings-db8b0-default-rtdb.firebaseio.com",
  projectId: "fixthings-db8b0",
  storageBucket: "fixthings-db8b0.appspot.com",
  messagingSenderId: "829720853067",
  appId: "1:829720853067:web:a85ebf7b499e108f382bce",
  measurementId: "G-CBE8M6V0TL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);