// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9cwZdJSMOQ6qw_0sRIdgdS7PPzqrVu5g",
  authDomain: "ourcravebook.firebaseapp.com",
  projectId: "ourcravebook",
  storageBucket: "ourcravebook.firebasestorage.app",
  messagingSenderId: "500658571362",
  appId: "1:500658571362:web:e5f4acbb872f5a08e2a93b",
  measurementId: "G-C7Q3ZZLPG5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
