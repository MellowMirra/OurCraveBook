// Drag & Drop Wishlist
const dropzone = document.getElementById('dropzone');
const wishlist = document.getElementById('wishlist');

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.style.background = 'rgba(255,255,255,0.1)';
});

dropzone.addEventListener('dragleave', () => {
  dropzone.style.background = 'transparent';
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.background = 'transparent';

  const data = e.dataTransfer.getData('text/plain');
  if (data) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${data}" target="_blank">${data}</a>`;
    wishlist.appendChild(li);
  }
});

// Stripe Setup Example
const stripe = Stripe(pk_live_51S0TzFAnphGmpjq0aTGG9PsupH5XjLC2Ytae54bOeA9cXEMUNaTTJyVEQUyfJ0B8e46RWOTFXnut2BB93vCiPX7100nTFxETZh);

document.getElementById('donate-button').addEventListener('click', async () => {
  // create session for donation
});

document.getElementById('buy-button').addEventListener('click', async () => {
  // create session for full purchase
});
// Import Firebase modules (already in firebase-config.js)
import { auth, db } from "./firebase-config.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, query, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Stripe setup (replace with your Publishable Key)
const stripe = Stripe(pk_live_51S0TzFAnphGmpjq0aTGG9PsupH5XjLC2Ytae54bOeA9cXEMUNaTTJyVEQUyfJ0B8e46RWOTFXnut2BB93vCiPX7100nTFxETZh);

// DOM elements
const dropzone = document.getElementById('dropzone');
const wishlist = document.getElementById('wishlist');
const donateBtn = document.getElementById('donate-button');
const buyBtn = document.getElementById('buy-button');

// Google login
const provider = new GoogleAuthProvider();

async function login() {
  try {
    await signInWithPopup(auth, provider);
    alert("Logged in with Google! 🫶");
  } catch (error) {
    console.error(error);
    alert("Login failed. Check console.");
  }
}

// Detect login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.displayName);
    listenWishlist(user.uid);
  } else {
    console.log("No user logged in");
  }
});

// Firestore: listen to user's wishlist
function listenWishlist(uid) {
  const wishlistCol = collection(db, "users", uid, "wishlist");
  const q = query(wishlistCol);
  onSnapshot(q, (snapshot) => {
    wishlist.innerHTML = "";
    snapshot.forEach(doc => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${doc.data().url}" target="_blank">${doc.data().url}</a>`;
      wishlist.appendChild(li);
    });
  });
}

// Drag & Drop wishlist
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(255,255,255,0.1)'; });
dropzone.addEventListener('dragleave', () => { dropzone.style.background = 'transparent'; });
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropzone.style.background = 'transparent';
  const data = e.dataTransfer.getData('text/plain');
  if (data && auth.currentUser) {
    const uid = auth.currentUser.uid;
    try {
      await addDoc(collection(db, "users", uid, "wishlist"), { url: data });
    } catch (err) { console.error(err); }
  }
});

// Stripe: Donate
donateBtn.addEventListener('click', async () => {
  const session = await fetch("/create-donation-session", { method: "POST" }).then(res => res.json());
  stripe.redirectToCheckout({ sessionId: session.id });
});

// Stripe: Buy
buyBtn.addEventListener('click', async () => {
  const session = await fetch("/create-purchase-session", { method: "POST" }).then(res => res.json());
  stripe.redirectToCheckout({ sessionId: session.id });
});
