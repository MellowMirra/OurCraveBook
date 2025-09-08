import { auth, db, storage, provider } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

/* Splash & Toast */
const finishSplash = () => { document.documentElement.classList.add("hide-splash"); setTimeout(()=>{ document.getElementById("splash")?.remove(); }, 700); };
window.addEventListener("load", () => setTimeout(finishSplash, 1000));
const toast = document.getElementById("toast");
function showToast(msg){ if(!toast) return; toast.textContent = msg; toast.classList.add("show"); setTimeout(()=> toast.classList.remove("show"), 2600); }

/* Theme */
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
function setTheme(light){ root.classList.toggle("light", !!light); localStorage.setItem("themeLight", light ? "1":"0"); }
themeToggle?.addEventListener("click", ()=> setTheme(!root.classList.contains("light")));
setTheme(localStorage.getItem("themeLight")==="1");

/* Stripe (publishable key is now an env var) */
const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/* Referral capture */
const urlParams = new URLSearchParams(location.search);
const refKeys = ["utm_source","utm_medium","utm_campaign","utm_content","ref"];
const referral = {}; refKeys.forEach(k=>{ const v = urlParams.get(k); if(v) referral[k]=v; });
if (Object.keys(referral).length){ localStorage.setItem("referral", JSON.stringify(referral)); }

/* DOM refs */
const sections = document.getElementById("sections");
const loginBtn = document.getElementById("loginBtn");
const openProfile = document.getElementById("openProfile");
const addModal = document.getElementById("addModal");
// Donate Modal Refs
const donateModal = document.getElementById("donateModal");
const donateItemTitle = document.getElementById("donateItemTitle");
const donateAmount = document.getElementById("donateAmount");
const submitDonation = document.getElementById("submitDonation");
// Domain Request Modal Refs
const openDomainRequest = document.getElementById("openDomainRequest");
const domainRequestModal = document.getElementById("domainRequestModal");
const domainRequestInput = document.getElementById("domainRequestInput");
const submitDomainRequest = document.getElementById("submitDomainRequest");

/* Creator Mode & Auth */
function setCreatorMode(on){ localStorage.setItem("creatorMode", on ? "1":"0"); document.documentElement.classList.toggle("creator-on", !!on); creatorPanel?.setAttribute("aria-hidden", on ? "false":"true"); }
document.getElementById("creatorToggle")?.addEventListener("change", (e)=> setCreatorMode(e.target.checked));
const savedCreator = localStorage.getItem("creatorMode")==="1"; if (document.getElementById("creatorToggle")){ document.getElementById("creatorToggle").checked = savedCreator; setCreatorMode(savedCreator); }
async function login(){ try{ await signInWithPopup(auth, provider); }catch(e){ console.error(e); showToast("Login failed."); } }
loginBtn?.addEventListener("click", login);
let currentUID = null;
onAuthStateChanged(auth, async (user)=>{
  if(user){
    loginBtn.textContent = `Hi, ${user.displayName?.split(" ")[0] || "you"} ✨`;
    currentUID = user.uid;
    document.getElementById("publicLink").href = `/public.html?user=${encodeURIComponent(user.uid)}`;
    listenWishlist(user.uid);
    await loadProfile(user.uid);
  } else {
    loginBtn.textContent = "Sign in with Google"; document.getElementById("publicLink").href="#"; currentUID = null;
  }
});

/* Wishlist Rendering (XSS Patched & Vercel Images) */
function renderItem(it, id){
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.id = id;

  const contributed = it.contributed || 0;
  const goalCents = it.price ? parseInt(it.price, 10) * 100 : null;
  const pct = goalCents ? Math.min(100, Math.round((contributed / goalCents) * 100)) : 0;

  const metaWrap = document.createElement('div');
  metaWrap.style.cssText = 'display:flex; gap:.75rem; align-items:center; flex:1;';
  
  if (it.image) {
    const img = document.createElement('img');
    img.className = 'item-img';
    const encodedUrl = encodeURIComponent(it.image);
    img.src = `/_next/image?url=${encodedUrl}&w=128&q=75`;
    img.alt = it.title || "Wishlist item image";
    metaWrap.appendChild(img);
  }

  const itemMeta = document.createElement('div');
  itemMeta.className = 'item-meta';
  const titleLink = document.createElement('a');
  titleLink.className = 'item-title';
  titleLink.href = it.url;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener';
  titleLink.textContent = it.title || it.url;
  itemMeta.appendChild(titleLink);

  if (it.notes) {
    const notesDiv = document.createElement('div');
    notesDiv.className = 'item-notes muted tiny';
    notesDiv.textContent = it.notes;
    itemMeta.appendChild(notesDiv);
  }
  metaWrap.appendChild(itemMeta);
  li.appendChild(metaWrap);

  const progressWrap = document.createElement('div');
  progressWrap.className = 'item-progress';
  if (goalCents) {
    const progressLabel = document.createElement('div');
    progressLabel.className = 'muted tiny';
    progressLabel.style.cssText = 'text-align:right; margin-bottom:4px;';
    progressLabel.textContent = `$${it.price} · $${Math.round(contributed/100)} raised`;
    progressWrap.appendChild(progressLabel);
  }
  const progressBar = document.createElement('div');
  progressBar.className = 'progress';
  const progressFill = document.createElement('div');
  progressFill.style.width = `${pct}%`;
  progressBar.appendChild(progressFill);
  progressWrap.appendChild(progressBar);
  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display:flex; gap:.4rem; justify-content:flex-end; margin-top:.4rem';

  const donateBtn = document.createElement('button');
  donateBtn.className = 'btn tiny';
  donateBtn.textContent = 'Contribute';
  donateBtn.dataset.donate = true;
  donateBtn.dataset.id = id;
  donateBtn.dataset.title = it.title || "this item";
  btnGroup.appendChild(donateBtn);

  const buyBtn = document.createElement('button');
  buyBtn.className = 'btn tiny';
  buyBtn.textContent = 'Buy';
  buyBtn.dataset.buy = true;
  buyBtn.dataset.id = id;
  if (goalCents) {
    buyBtn.dataset.price = it.price;
  } else {
    buyBtn.disabled = true;
  }
  btnGroup.appendChild(buyBtn);
  
  progressWrap.appendChild(btnGroup);
  li.appendChild(progressWrap);

  attachDrag(li);
  return li;
}
function renderSections(byCat){
  sections.innerHTML = "";
  Object.keys(byCat).sort().forEach(cat=>{
    const h = document.createElement("h4"); h.className="section-header"; h.textContent = cat; sections.appendChild(h);
    const ul = document.createElement("ul"); ul.className = "wishlist"; sections.appendChild(ul);
    byCat[cat].forEach(({id, data})=> ul.appendChild(renderItem(data, id)));
  });
}
function listenWishlist(uid){
  const q = query(collection(db, "users", uid, "wishlist"), orderBy("order","asc"));
  onSnapshot(q, (snap)=>{
    const byCat = {};
    snap.forEach((d)=>{ const data = d.data(); const cat = data.category || "General"; (byCat[cat]=byCat[cat]||[]).push({id:d.id, data}); });
    renderSections(byCat);
    
    document.querySelectorAll("[data-donate]").forEach(b=> b.addEventListener("click", ()=>{
        donateModal.dataset.itemId = b.dataset.id;
        donateItemTitle.textContent = `Contribute towards "${b.dataset.title}"`;
        donateModal.showModal();
    }));
    document.querySelectorAll("[data-buy]").forEach(b=> b.addEventListener("click", ()=> createSession("/api/create-purchase-session","purchase", b.dataset.id)));
  });
}
async function addItem(data){
  if(!auth.currentUser){ await login(); }
  const uid = auth.currentUser?.uid; if(!uid) return;
  const now = Date.now();
  const refMeta = JSON.parse(localStorage.getItem("referral")||"{}");
  await addDoc(collection(db,"users",uid,"wishlist"), { ...data, contributed: 0, createdAt: now, order: now });
  if (Object.keys(refMeta).length) await setDoc(doc(db,"users",uid,"meta","lastRef"), { ...refMeta, lastAt: now }, { merge: true });
  showToast("Added to your Craves ✨");
}

/* Drag & Drop */
function attachDrag(li){ /* ... (unchanged) ... */ }
function getDragAfterElement(container, y){ /* ... (unchanged) ... */ }
sections.addEventListener("drop", async ()=>{
  if(!auth.currentUser) return;
  const lists = sections.querySelectorAll("ul.wishlist");
  let idx = 0;
  for (const ul of lists){
    for (const el of ul.children){
      const id = el.dataset.id; if (!id) continue;
      await updateDoc(doc(db,"users",auth.currentUser.uid,"wishlist",id), { order: (++idx)*1000 });
    }
  }
  showToast("Order saved 💾");
});

/* Modals & Profile Logic */
document.getElementById("openAdd")?.addEventListener("click", ()=> addModal.showModal());
document.getElementById("addItem")?.addEventListener("click", async (e)=>{ /* ... (unchanged) ... */ });
document.getElementById("autoFill")?.addEventListener("click", async (e)=>{ /* ... (unchanged) ... */ });
openProfile?.addEventListener("click", ()=> document.getElementById("profileModal").showModal());
document.getElementById("avatarInput")?.addEventListener("change", async (e)=>{ /* ... (unchanged) ... */ });
async function loadProfile(uid){ /* ... (unchanged) ... */ }
document.getElementById("saveProfile")?.addEventListener("click", async (e)=>{ /* ... (unchanged) ... */ });

/* Email Capture */
document.getElementById("email-form")?.addEventListener("submit", async (e)=>{ /* ... (unchanged) ... */ });

/* Checkout Logic */
async function createSession(endpoint, type, itemId, customAmount = null){
  let amount = customAmount, title = "Wishlist Support";
  if (type === "purchase" && itemId){
    const li = document.querySelector(`li[data-id="${itemId}"]`);
    const button = li?.querySelector('[data-buy]');
    const dollars = button?.dataset.price ? parseInt(button.dataset.price, 10) : 20;
    amount = dollars * 100;
    title = li?.querySelector(".item-title")?.textContent || "Wishlist Item";
  }
  const refMeta = JSON.parse(localStorage.getItem("referral")||"{}");
  const body = JSON.stringify({ uid: auth.currentUser?.uid || "anon", type, itemId: itemId || null, amount, title, referral: refMeta });
  const res = await fetch(endpoint,{ method:"POST", headers:{ "Content-Type":"application/json" }, body });
  if(!res.ok){ showToast("Checkout unavailable."); return; }
  const data = await res.json();
  const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
  if(error) showToast(error.message||"Checkout error.");
}

/* Modal Event Handlers */
submitDonation?.addEventListener('click', (e) => {
    e.preventDefault();
    const amount = parseInt(donateAmount.value, 10);
    const itemId = donateModal.dataset.itemId;
    if (isNaN(amount) || amount < 1) { showToast("Please enter a valid amount."); return; }
    createSession('/api/create-donation-session', 'donation', itemId, amount * 100);
    donateModal.close();
});

openDomainRequest?.addEventListener('click', () => domainRequestModal.showModal());

submitDomainRequest?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) { showToast("Please sign in first."); return; }
    const domain = (domainRequestInput.value || "").trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    if (!domain || !domain.includes('.')) { showToast("Please enter a valid domain (e.g., gucci.com)"); return; }

    try {
        await addDoc(collection(db, "domainRequests"), {
            domain: domain,
            requestedBy: auth.currentUser.uid,
            requestedAt: serverTimestamp()
        });
        showToast("Domain request submitted! ✨");
        domainRequestInput.value = '';
        domainRequestModal.close();
    } catch (err) {
        console.error("Error submitting domain request:", err);
        showToast("Could not submit request.");
    }
});


/* PPV Unlock & Link Dropzone */
document.getElementById("unlock-button")?.addEventListener("click", ()=> createSession("/api/create-gallery-session","unlock"));
if (window.location.search.includes("unlocked=true")){ document.getElementById("exclusive-gallery").classList.add("unlocked"); showToast("Gallery unlocked 💎 enjoy!"); }
if (window.location.search.includes("success=true")){ showToast("Thank you for the love 💖"); }
const dropzone = document.getElementById("dropzone");
if (dropzone){ /* ... (unchanged) ... */ }
