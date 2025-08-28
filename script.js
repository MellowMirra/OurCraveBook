// Basic Drag & Drop for wishlist
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

// TODO: Connect Stripe + Firebase later
