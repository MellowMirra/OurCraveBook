import { auth, db } from "./firebase-config";
const dropZone = document.getElementById("drop-zone");
const wishlist = document.getElementById("wishlist");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const data = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
  
  if (data) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${data}" target="_blank">${data}</a>`;
    wishlist.appendChild(li);
  }
});
