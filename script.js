
import { auth, db, storage, provider } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

/* Splash */
const finishSplash = () => { document.documentElement.classList.add("hide-splash"); setTimeout(()=>{ document.getElementById("splash")?.remove(); }, 700); };
window.addEventListener("load", () => setTimeout(finishSplash, 1000));

/* Toast */
const toast = document.getElementById("toast");
function showToast(msg){ toast.textContent = msg; toast.classList.add("show"); setTimeout(()=> toast.classList.remove("show"), 2600); }

/* Theme */
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
function setTheme(light){ root.classList.toggle("light", !!light); localStorage.setItem("themeLight", light ? "1":"0"); }
themeToggle?.addEventListener("click", ()=> setTheme(!root.classList.contains("light")));
setTheme(localStorage.getItem("themeLight")==="1");

/* Stripe */
const stripe = Stripe("pk_live_51S0TzFAnphGmpjq0aTGG9PsupH5XjLC2Ytae54bOeA9cXEMUNaTTJyVEQUyfJ0B8e46RWOTFXnut2BB93vCiPX7100nTFxETZh");

/* Referral capture */
const urlParams = new URLSearchParams(location.search);
const refKeys = ["utm_source","utm_medium","utm_campaign","utm_content","ref"];
const referral = {}; refKeys.forEach(k=>{ const v = urlParams.get(k); if(v) referral[k]=v; });
if (Object.keys(referral).length){ localStorage.setItem("referral", JSON.stringify(referral)); }

/* DOM refs */
const wishlist = document.getElementById("wishlist");
const sections = document.getElementById("sections");
const loginBtn = document.getElementById("loginBtn");
const creatorToggle = document.getElementById("creatorToggle");
const creatorPanel = document.getElementById("creatorPanel");
const openProfile = document.getElementById("openProfile");
const profileModal = document.getElementById("profileModal");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const displayName = document.getElementById("displayName");
const bio = document.getElementById("bio");
const notifyEmail = document.getElementById("notifyEmail");
const ig = document.getElementById("ig"); const tw = document.getElementById("tw"); const of = document.getElementById("of"); const web = document.getElementById("web");
const saveProfile = document.getElementById("saveProfile");
const publicLink = document.getElementById("publicLink");
const unlockBtn = document.getElementById("unlock-button");
const gallery = document.getElementById("exclusive-gallery");
const emailForm = document.getElementById("email-form");
const emailInput = document.getElementById("email-input"); const emailSuccess = document.getElementById("email-success");
const openAdd = document.getElementById("openAdd");
const addModal = document.getElementById("addModal");
const autoFill = document.getElementById("autoFill");
const itemUrl = document.getElementById("itemUrl"); const itemImage = document.getElementById("itemImage");
const itemPrice = document.getElementById("itemPrice"); const itemTitle = document.getElementById("itemTitle"); const itemNotes = document.getElementById("itemNotes");
const itemCategory = document.getElementById("itemCategory");

/* Creator Mode */
function setCreatorMode(on){ localStorage.setItem("creatorMode", on ? "1":"0"); document.documentElement.classList.toggle("creator-on", !!on); creatorPanel?.setAttribute("aria-hidden", on ? "false":"true"); }
creatorToggle?.addEventListener("change", (e)=> setCreatorMode(e.target.checked));
const savedCreator = localStorage.getItem("creatorMode")==="1"; if (creatorToggle){ creatorToggle.checked = savedCreator; setCreatorMode(savedCreator); }

/* Auth */
async function login(){ try{ await signInWithPopup(auth, provider); }catch(e){ console.error(e); showToast("Login failed."); } }
loginBtn?.addEventListener("click", login);
let currentUID = null;
onAuthStateChanged(auth, async (user)=>{
  if(user){
    loginBtn.textContent = `Hi, ${user.displayName?.split(" ")[0] || "you"} ✨`;
    currentUID = user.uid;
    publicLink.href = `/public.html?user=${encodeURIComponent(user.uid)}`;
    listenWishlist(user.uid);
    await loadProfile(user.uid);
  } else {
    loginBtn.textContent = "Sign in with Google"; publicLink.href="#"; currentUID = null;
  }
});

/* Render */
function renderItem(it, id){
  const li = document.createElement("li");
  li.draggable = true; li.dataset.id = id;
  const contributed = it.contributed || 0;
  const goalCents = it.price ? parseInt(it.price,10)*100 : null;
  const pct = goalCents ? Math.min(100, Math.round((contributed/goalCents)*100)) : 0;
  const img = it.image ? `<img class="item-img" src="${it.image}" alt="">` : "";
  const priceText = it.price ? `$${it.price}` : "";
  li.innerHTML = `
    <div class="item-meta-wrap" style="display:flex; gap:.75rem; align-items:center; flex:1;">
      ${img}
      <div class="item-meta">
        <a class="item-title" href="${it.url}" target="_blank" rel="noopener">${it.title || it.url}</a>
        ${it.notes ? `<div class="item-notes">${it.notes}</div>` : ""}
      </div>
    </div>
    <div class="item-progress">
      ${goalCents ? `<div class="muted tiny" style="text-align:right; margin-bottom:4px;">${priceText} · ${Math.round(contributed/100)} raised</div>` : ""}
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div style="display:flex; gap:.4rem; justify-content:flex-end; margin-top:.4rem">
        <button class="btn tiny" data-donate data-id="${id}">Contribute</button>
        <button class="btn tiny" data-buy data-id="${id}" ${goalCents? "" : "disabled"}>Buy</button>
      </div>
    </div>`;
  attachDrag(li);
  return li;
}
function renderSections(byCat){
  sections.innerHTML = "";
  Object.keys(byCat).forEach(cat=>{
    const h = document.createElement("h4"); h.className="section-header"; h.textContent = cat; sections.appendChild(h);
    const ul = document.createElement("ul"); ul.className="wishlist"; sections.appendChild(ul);
    byCat[cat].forEach(({id, data})=> ul.appendChild(renderItem(data, id)));
  });
}
function listenWishlist(uid){
  const wishlistCol = collection(db, "users", uid, "wishlist");
  const q = query(wishlistCol, orderBy("order","asc"));
  onSnapshot(q, (snap)=>{
    const byCat = {};
    snap.forEach((d)=>{ const data = d.data(); const cat = data.category || "General"; (byCat[cat]=byCat[cat]||[]).push({id:d.id, data}); });
    renderSections(byCat);
    document.querySelectorAll("[data-donate]").forEach(b=> b.addEventListener("click", ()=> createSession("/api/create-donation-session","donation", b.dataset.id)));
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

/* Drag & reorder */
function attachDrag(li){
  li.addEventListener("dragstart", ()=> li.classList.add("dragging"));
  li.addEventListener("dragend", ()=> li.classList.remove("dragging"));
  li.addEventListener("dragover", (e)=>{
    e.preventDefault();
    const after = getDragAfterElement(li.parentElement, e.clientY);
    if (after == null) li.parentElement.appendChild(li);
    else li.parentElement.insertBefore(li, after);
  });
}
function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll("li:not(.dragging)")];
  return els.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
sections.addEventListener("drop", persistOrder);
async function persistOrder(){
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
}

/* Add modal */
openAdd?.addEventListener("click", ()=> addModal.showModal());
document.getElementById("addItem")?.addEventListener("click", async (e)=>{
  e.preventDefault();
  const url = itemUrl.value.trim();
  if(!url){ showToast("URL required"); return; }
  const data = { url, image: itemImage.value.trim()||null, price: itemPrice.value ? parseInt(itemPrice.value,10) : null, title: itemTitle.value.trim()||null, notes: itemNotes.value.trim()||null, category: itemCategory.value || "General" };
  await addItem(data);
  itemUrl.value = itemImage.value = itemNotes.value = itemTitle.value = ""; itemPrice.value = "";
  addModal.close();
});

/* Smart link parser */
document.getElementById("autoFill")?.addEventListener("click", async (e)=>{
  e.preventDefault();
  const url = (itemUrl.value||"").trim();
  if(!url){ showToast("Add a URL first"); return; }
  const res = await fetch("/api/parse-link", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ url }) });
  if(!res.ok){ showToast("Could not parse link"); return; }
  const data = await res.json();
  if (data.title && !itemTitle.value) itemTitle.value = data.title;
  if (data.image && !itemImage.value) itemImage.value = data.image;
  if (data.price && !itemPrice.value) itemPrice.value = data.price;
  showToast("Auto-filled from link ✨");
});

/* Profile modal & upload */
openProfile?.addEventListener("click", ()=> profileModal.showModal());
avatarInput?.addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if (!file || !auth.currentUser) return;
  const p = `avatars/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
  await uploadBytes(ref(storage, p), file);
  const url = await getDownloadURL(ref(storage, p));
  avatarPreview.src = url;
  await setDoc(doc(db,"users",auth.currentUser.uid,"meta","profile"), { avatarPath: p }, { merge: true });
  showToast("Avatar updated");
});
async function loadProfile(uid){
  const snap = await getDoc(doc(db,"users",uid,"meta","profile"));
  if (snap.exists()){
    const p = snap.data();
    displayName.value = p.displayName || ""; bio.value = p.bio || ""; notifyEmail.value = p.notifyEmail || "";
    ig.value = p.ig || ""; tw.value = p.tw || ""; of.value = p.of || ""; web.value = p.web || "";
    if (p.avatarPath){ try{ avatarPreview.src = await getDownloadURL(ref(storage, p.avatarPath)); }catch{} }
  }
}
saveProfile?.addEventListener("click", async (e)=>{
  e.preventDefault(); if(!auth.currentUser) return;
  await setDoc(doc(db,"users",auth.currentUser.uid,"meta","profile"), {
    displayName: displayName.value.trim() || null,
    bio: bio.value.trim() || null,
    notifyEmail: notifyEmail.value.trim() || null,
    ig: ig.value.trim() || null, tw: tw.value.trim() || null, of: of.value.trim() || null, web: web.value.trim() || null
  }, { merge: true });
  profileModal.close(); showToast("Profile saved");
});

/* Email capture */
if (emailForm){
  emailForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = (emailInput.value||"").trim();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showToast("Enter a valid email"); return; }
    try{
      const refMeta = JSON.parse(localStorage.getItem("referral")||"{}");
      await addDoc(collection(db,"waitlist"), { email, createdAt: Date.now(), uid: auth.currentUser?.uid || null, ...refMeta });
      emailInput.value = ""; emailSuccess.hidden = false; setTimeout(()=> emailSuccess.hidden = true, 3500);
      showToast("You're on the list ✨");
    }catch(err){ console.error(err); showToast("Could not save email."); }
  });
}

/* Checkout with metadata */
async function createSession(endpoint, type, itemId){
  let amount = null; let title = "Wishlist Support";
  if (type === "donation"){ const input = prompt("Enter amount (USD):", "10"); if(!input) return; amount = Math.max(1, parseInt(input,10)) * 100; }
  if (type === "purchase" && itemId){
    // derive price from UI text or fallback 20
    const li = document.querySelector(`li[data-id="${itemId}"]`);
    const txt = li?.innerText || ""; const m = txt.match(/\$(\d+)/); const dollars = m?parseInt(m[1],10):20;
    amount = dollars * 100; title = li?.querySelector(".item-title")?.textContent || "Wishlist Item";
  }
  const refMeta = JSON.parse(localStorage.getItem("referral")||"{}");
  const body = JSON.stringify({ uid: auth.currentUser?.uid || "anon", type, itemId: itemId || null, amount, title, referral: refMeta });
  const res = await fetch(endpoint,{ method:"POST", headers:{ "Content-Type":"application/json" }, body });
  if(!res.ok){ showToast("Checkout unavailable."); return; }
  const data = await res.json();
  const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
  if(error) showToast(error.message||"Checkout error.");
}

/* PPV */
unlockBtn?.addEventListener("click", ()=> createSession("/api/create-gallery-session","unlock"));
if (window.location.search.includes("unlocked=true")){ gallery.classList.add("unlocked"); showToast("Gallery unlocked 💎 enjoy!"); }
if (window.location.search.includes("success=true")){ showToast("Thank you for the love 💖"); }

/* Drop zone parsing */
const dropzone = document.getElementById("dropzone");
if (dropzone){
  ["dragover","dragenter"].forEach(ev=> dropzone.addEventListener(ev,(e)=>{e.preventDefault(); dropzone.style.background="rgba(255,255,255,.08)";}));
  ["dragleave","drop","blur"].forEach(ev=> dropzone.addEventListener(ev,()=> dropzone.style.background="transparent"));
  dropzone.addEventListener("drop", async (e)=>{
    e.preventDefault();
    const data = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if(!data) return;
    try{
      new URL(data);
      const res = await fetch("/api/parse-link", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ url: data }) });
      let parsed = {}; if (res.ok) parsed = await res.json();
      await addItem({ url: data, image: parsed.image||null, price: parsed.price||null, title: parsed.title||null, category: "General" });
    }catch{ showToast("Drop a valid link ✨"); }
  });
}

/* Copy public link */
const copyBtn = document.createElement("button");
copyBtn.textContent = "Copy Public Link"; copyBtn.className = "btn ghost";
copyBtn.addEventListener("click", ()=>{ if (publicLink.href && publicLink.href !== "#"){ navigator.clipboard.writeText(publicLink.href); showToast("Link copied ✨"); } });
publicLink?.insertAdjacentElement("afterend", copyBtn);
