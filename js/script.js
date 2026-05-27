// Variable principal donde se almacenan todas las mascotas. Se carga desde localStorage al iniciar la aplicación y se actualiza cada vez que se agrega, edita o elimina una mascota.
let mascotas = [];
// Variable utilizada para guardar temporalmente el índice de la mascota que se desea eliminar, para mostrar su nombre en el modal de confirmación y luego eliminarla si se confirma la acción.
let idxEliminar = -1;
// Clave utilizada para guardar y recuperar la lista de mascotas en localStorage, asegurando que los datos persistan entre sesiones del navegador.
const STORAGE_KEY = 'vetpaw_mascotas';
//Esto permite reutilizar datos fácilmente. Se asigna un emoji y una clase de avatar específica para cada tipo de mascota, lo que facilita la representación visual en la interfaz de usuario.
const EMOJIS = {
  perro:  '🐶',
  gato:   '🐱',
  conejo: '🐰',
  ave:    '🦜',
  otro:   '🐾'
};

const AVATAR_CLASSES = {
  perro:  'avatar-perro',
  gato:   'avatar-gato',
  conejo: 'avatar-conejo',
  ave:    'avatar-ave',
  otro:   'avatar-otro'
};
//Carga las mascotas guardadas en localStorage.Si no existen datos, crea un arreglo vacío.
function cargarStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  mascotas = raw ? JSON.parse(raw) : [];
}

function guardarStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mascotas));
}
//Esta función valida que los datos del formulario estén correctos. También muestra errores visuales si falta información.
function validarFormulario() {
  let ok = true;

  function mark(id, condicion) {
    const el = document.getElementById(id);
    el.classList.remove('is-invalid', 'is-valid');
    if (!condicion) {
      el.classList.add('is-invalid');
      ok = false;
    } else {
      el.classList.add('is-valid');
    }
  }

  const nombre = document.getElementById('inp-nombre').value.trim();
  const tipo   = document.getElementById('inp-tipo').value;
  const edad   = document.getElementById('inp-edad').value;
  const dueno  = document.getElementById('inp-dueno').value.trim();
  const email  = document.getElementById('inp-email').value.trim();

  mark('inp-nombre', nombre.length >= 2);
  mark('inp-tipo',   tipo !== '');
  mark('inp-edad',   edad !== '' && Number(edad) >= 0 && Number(edad) <= 50);
  mark('inp-dueno',  dueno.length >= 2);

  if (email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    mark('inp-email', regexEmail.test(email));
  }

  return ok;
}
//Construye un objeto mascota a partir de los datos ingresados en el formulario. Este objeto se utiliza tanto para agregar nuevas mascotas como para actualizar las existentes.
function construirObjeto() {
  return {
    id:       Date.now(),
    nombre:   document.getElementById('inp-nombre').value.trim(),
    tipo:     document.getElementById('inp-tipo').value,
    edad:     Number(document.getElementById('inp-edad').value),
    raza:     document.getElementById('inp-raza').value.trim(),
    dueno:    document.getElementById('inp-dueno').value.trim(),
    telefono: document.getElementById('inp-telefono').value.trim(),
    email:    document.getElementById('inp-email').value.trim(),
    fechaReg: new Date().toLocaleDateString('es-CL')
  };
}
//Aquí valido el formulario, creo la mascota,
// la guardo y actualizo la interfaz automáticamente.
function guardarMascota() {
  if (!validarFormulario()) {
    mostrarToast('Corrige los campos marcados en rojo.', 'error');
    return;
  }

  const idx = parseInt(document.getElementById('edit-index').value);
  const obj = construirObjeto();

  if (idx === -1) {
    // push() agrega una mascota al arreglo.
    mascotas.push(obj);
    mostrarToast(`🐾 ${obj.nombre} registrado correctamente.`, 'success');
  } else {
    obj.id      = mascotas[idx].id;
    obj.fechaReg = mascotas[idx].fechaReg;
    mascotas[idx] = obj;
    mostrarToast(`✏️ ${obj.nombre} actualizado.`, 'success');
  }

  guardarStorage();
  limpiarFormulario();
  renderLista();
  actualizarStats();
}
//Esta función se llama cuando el usuario hace clic en "Editar" en una tarjeta de mascota. Carga los datos de esa mascota en el formulario para que puedan ser modificados.
function editarMascota(idx) {
  const m = mascotas[idx];

  document.getElementById('edit-index').value   = idx;
  document.getElementById('inp-nombre').value   = m.nombre;
  document.getElementById('inp-tipo').value     = m.tipo;
  document.getElementById('inp-edad').value     = m.edad;
  document.getElementById('inp-raza').value     = m.raza;
  document.getElementById('inp-dueno').value    = m.dueno;
  document.getElementById('inp-telefono').value = m.telefono;
  document.getElementById('inp-email').value    = m.email;

  document.getElementById('form-title').textContent = 'Editar Mascota';
  document.getElementById('btn-label').textContent  = 'Actualizar';
  document.getElementById('btn-cancelar').style.display = '';

  ['inp-nombre', 'inp-tipo', 'inp-edad', 'inp-dueno', 'inp-email'].forEach(id => {
    document.getElementById(id).classList.remove('is-invalid', 'is-valid');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function pedirEliminar(idx) {
  idxEliminar = idx;
  document.getElementById('modal-pet-name').textContent = mascotas[idx].nombre;
  new bootstrap.Modal(document.getElementById('modal-eliminar')).show();
}
//Cuando el usuario confirma que desea eliminar una mascota, esta función la elimina del arreglo, actualiza el almacenamiento y la interfaz, y muestra una notificación.
function confirmarEliminar() {
  if (idxEliminar < 0) return;

  const nombre = mascotas[idxEliminar].nombre;
  // splice() elimina la mascota del arreglo en la posición idxEliminar.
  mascotas.splice(idxEliminar, 1);

  guardarStorage();
  renderLista();
  actualizarStats();
  mostrarToast(`🗑️ ${nombre} eliminado.`, 'warn');

  bootstrap.Modal.getInstance(document.getElementById('modal-eliminar')).hide();
  idxEliminar = -1;
}

function cancelarEdicion() {
  limpiarFormulario();
  mostrarToast('Edición cancelada.', '');
}

function limpiarFormulario() {
  const ids = [
    'inp-nombre', 'inp-tipo', 'inp-edad', 'inp-raza',
    'inp-dueno', 'inp-telefono', 'inp-email'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('is-invalid', 'is-valid');
  });

  document.getElementById('edit-index').value        = -1;
  document.getElementById('form-title').textContent  = 'Registrar Mascota';
  document.getElementById('btn-label').textContent   = 'Registrar';
  document.getElementById('btn-cancelar').style.display = 'none';
}
//permite buscar mascotas según condiciones.
function filtrarMascotas() {
  const query = document.getElementById('inp-buscar').value.trim().toLowerCase();
  const tipo  = document.getElementById('sel-filtro-tipo').value;

  return mascotas.filter(m => {
    const matchTipo  = tipo === '' || m.tipo === tipo;
    const matchQuery = !query
      || m.nombre.toLowerCase().includes(query)
      || m.dueno.toLowerCase().includes(query)
      || (m.raza && m.raza.toLowerCase().includes(query));

    return matchTipo && matchQuery;
  });
}

function setChip(el, tipo) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sel-filtro-tipo').value = tipo;
  renderLista();
}
//Esta función crea automáticamente las tarjetas de mascotas. Y actualiza el DOM cada vez que se agrega, edita o elimina una mascota.
function renderLista() {
  const grid  = document.getElementById('pet-grid');
  const lista = filtrarMascotas();

  grid.innerHTML = '';

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h5>No hay mascotas registradas</h5>
        <p>Agrega la primera mascota usando el formulario.</p>
      </div>`;
    return;
  }

  lista.forEach((m, i) => {
    const idxReal = mascotas.indexOf(m);
    const emoji   = EMOJIS[m.tipo]        || '🐾';
    const avClass = AVATAR_CLASSES[m.tipo] || 'avatar-otro';
// Aquí se construye el HTML de cada tarjeta de mascota, utilizando los datos del objeto mascota y aplicando estilos y animaciones para una mejor presentación visual.
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.style.animationDelay = `${i * 0.05}s`;

    card.innerHTML = `
      <div class="pet-card-top">
        <div class="pet-avatar ${avClass}">${emoji}</div>
        <div class="pet-info">
          <p class="pet-name">${escapar(m.nombre)}</p>
          <span class="pet-type-badge">${m.tipo}</span>
        </div>
      </div>
      <div class="pet-details">
        ${m.raza ? `<span><i class="bi bi-tag-fill"></i>${escapar(m.raza)}</span>` : ''}
        <span><i class="bi bi-calendar3"></i>${m.edad} año${m.edad !== 1 ? 's' : ''}</span>
        <span><i class="bi bi-person-fill"></i>${escapar(m.dueno)}</span>
        ${m.telefono ? `<span><i class="bi bi-telephone-fill"></i>${escapar(m.telefono)}</span>` : ''}
        ${m.email    ? `<span><i class="bi bi-envelope-fill"></i>${escapar(m.email)}</span>`    : ''}
        <span><i class="bi bi-clock-history"></i>Registrado: ${m.fechaReg}</span>
      </div>
      <div class="pet-card-footer">
        <button class="btn-edit" onclick="editarMascota(${idxReal})">
          <i class="bi bi-pencil-fill"></i> Editar
        </button>
        <button class="btn-delete" onclick="pedirEliminar(${idxReal})">
          <i class="bi bi-trash3-fill"></i> Eliminar
        </button>
      </div>`;
// Finalmente, cada tarjeta se agrega al contenedor principal del grid para mostrar la lista actualizada de mascotas en la interfaz de usuario.
    grid.appendChild(card);
  });
}
//Actualiza estadísticas del header. Y evita contar dueños repetidos.
function actualizarStats() {
  document.getElementById('stat-total').textContent = mascotas.length;

  const duenos = new Set(mascotas.map(m => m.dueno.toLowerCase()));
  document.getElementById('stat-duenos').textContent = duenos.size;
}
//Muestra mensajes temporales al usuario.
function mostrarToast(msg, tipo = '') {
  const wrap = document.getElementById('toast-wrap');
  const t    = document.createElement('div');

  const iconos = {
    success: 'check-circle-fill',
    error:   'x-circle-fill',
    warn:    'exclamation-circle-fill',
    '':      'info-circle-fill'
  };

  t.className = `toast-msg ${tipo}`;
  t.innerHTML = `<i class="bi bi-${iconos[tipo] || 'info-circle-fill'}"></i> ${msg}`;
  wrap.appendChild(t);

  setTimeout(() => {
    t.style.opacity    = '0';
    t.style.transition = 'opacity .4s';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}
//Esta función ayuda a proteger el sistema evitando inyección de código malicioso.
function escapar(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

cargarStorage();
renderLista();
actualizarStats();