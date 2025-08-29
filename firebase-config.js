
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9cwZdJSMOQ6qw_0sRIdgdS7PPzqrVu5g",
  authDomain: "ourcravebook.firebaseapp.com",
  projectId: "ourcravebook",
  storageBucket: "ourcravebook.firebasestorage.app",
  messagingSenderId: "500658571362",
  appId: "1:500658571362:web:e5f4acbb872f5a08e2a93b",
  measurementId: "G-C7Q3ZZLPG5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);
export const provider = new GoogleAuthProvider();
