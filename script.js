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
const stripe = Stripe(pk_test_51S0TzOPBBjulJrK1nnT9sWmAbsc6wvFfrjrtE7K48CgxNQfr3nX2FmSqHQJg89jonhsiY5XgIi7cszHbTEevY29G00psKdIjTN);

document.getElementById('donate-button').addEventListener('click', async () => {
  // create session for donation
});

document.getElementById('buy-button').addEventListener('click', async () => {
  // create session for full purchase
});
