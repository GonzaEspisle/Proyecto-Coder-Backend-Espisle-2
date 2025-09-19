const socket = io();

const listEl = document.getElementById('list');
const createForm = document.getElementById('createForm');

function render(products) {
  listEl.innerHTML = '';
  products.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.title}</strong> — $${p.price} — Stock: ${p.stock}
    <br/><small>ID: ${p.id} | Code: ${p.code}</small>
    <br/><button data-id="${p.id}">Eliminar</button>`;
    listEl.appendChild(li);
  });
}

socket.on('products', render);

createForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(createForm).entries());
  data.price = Number(data.price);
  data.stock = Number(data.stock);
  data.thumbnails = data.thumbnails
    ? data.thumbnails.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  socket.emit('createProduct', data, (resp) => {
    if (!resp.ok) alert(resp.error);
    else createForm.reset();
  });
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  socket.emit('deleteProduct', id, (resp) => {
    if (!resp.ok) alert(resp.error);
  });
});
