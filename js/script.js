// ── MENÚ HAMBURGUESA ──
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger-btn');
  menu.classList.toggle('open');
  btn.classList.toggle('active');
}
function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('active');
}
document.addEventListener('click', function(e) {
  const header = document.querySelector('.site-header');
  if (!header.contains(e.target)) closeMenu();
});

// ═══════════════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════════════

let mascotas = [];      // Arreglo principal de objetos mascota
let idxEliminar = -1;   // Índice del registro a eliminar (para el modal)

const STORAGE_KEY = 'vetpaw_mascotas';

// Diccionario de emojis y clases de avatar por tipo
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

// ═══════════════════════════════════════════════════
//  localStorage — FUNCIONES REUTILIZABLES
// ═══════════════════════════════════════════════════

/**
 * Carga el arreglo de mascotas desde localStorage.
 * Si no existe, inicializa con arreglo vacío.
 */
function cargarStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  mascotas = raw ? JSON.parse(raw) : [];
}

/**
 * Guarda el arreglo de mascotas en localStorage.
 */
function guardarStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mascotas));
}

// ═══════════════════════════════════════════════════
//  VALIDACIONES — FUNCIÓN REUTILIZABLE
// ═══════════════════════════════════════════════════

/**
 * Valida todos los campos del formulario.
 * Marca los campos inválidos con la clase is-invalid de Bootstrap.
 * @returns {boolean} true si todo es válido, false si hay errores
 */
function validarFormulario() {
  let ok = true;

  // Función interna: marca un campo como válido o inválido
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

  // Validaciones obligatorias
  mark('inp-nombre', nombre.length >= 2);
  mark('inp-tipo',   tipo !== '');
  mark('inp-edad',   edad !== '' && Number(edad) >= 0 && Number(edad) <= 50);
  mark('inp-dueno',  dueno.length >= 2);

  // Email: solo valida si fue ingresado
  if (email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    mark('inp-email', regexEmail.test(email));
  }

  return ok;
}

// ═══════════════════════════════════════════════════
//  CONSTRUIR OBJETO MASCOTA
// ═══════════════════════════════════════════════════

/**
 * Lee los campos del formulario y retorna un objeto mascota.
 * @returns {Object} Objeto con los datos de la mascota
 */
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

// ═══════════════════════════════════════════════════
//  GUARDAR — CREAR O EDITAR
// ═══════════════════════════════════════════════════

/**
 * Registra una nueva mascota o actualiza una existente.
 * Lee el campo oculto edit-index para saber si es creación o edición.
 */
function guardarMascota() {
  if (!validarFormulario()) {
    mostrarToast('Corrige los campos marcados en rojo.', 'error');
    return;
  }

  const idx = parseInt(document.getElementById('edit-index').value);
  const obj = construirObjeto();

  if (idx === -1) {
    // CREAR: agregar al arreglo
    mascotas.push(obj);
    mostrarToast(`🐾 ${obj.nombre} registrado correctamente.`, 'success');
  } else {
    // EDITAR: actualizar objeto en el arreglo
    obj.id      = mascotas[idx].id;       // conservar id original
    obj.fechaReg = mascotas[idx].fechaReg; // conservar fecha de registro
    mascotas[idx] = obj;
    mostrarToast(`✏️ ${obj.nombre} actualizado.`, 'success');
  }

  guardarStorage();
  limpiarFormulario();
  renderLista();
  actualizarStats();
}

// ═══════════════════════════════════════════════════
//  EDITAR
// ═══════════════════════════════════════════════════

/**
 * Carga los datos de una mascota en el formulario para editarla.
 * @param {number} idx - Índice de la mascota en el arreglo mascotas
 */
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

  // Limpiar estados de validación del formulario anterior
  ['inp-nombre', 'inp-tipo', 'inp-edad', 'inp-dueno', 'inp-email'].forEach(id => {
    document.getElementById(id).classList.remove('is-invalid', 'is-valid');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════
//  ELIMINAR
// ═══════════════════════════════════════════════════

/**
 * Muestra el modal de confirmación para eliminar una mascota.
 * @param {number} idx - Índice de la mascota en el arreglo mascotas
 */
function pedirEliminar(idx) {
  idxEliminar = idx;
  document.getElementById('modal-pet-name').textContent = mascotas[idx].nombre;
  new bootstrap.Modal(document.getElementById('modal-eliminar')).show();
}

/**
 * Confirma y ejecuta la eliminación de la mascota seleccionada.
 * Usa splice() para eliminarla del arreglo.
 */
function confirmarEliminar() {
  if (idxEliminar < 0) return;

  const nombre = mascotas[idxEliminar].nombre;
  mascotas.splice(idxEliminar, 1); // eliminar del arreglo

  guardarStorage();
  renderLista();
  actualizarStats();
  mostrarToast(`🗑️ ${nombre} eliminado.`, 'warn');

  bootstrap.Modal.getInstance(document.getElementById('modal-eliminar')).hide();
  idxEliminar = -1;
}

// ═══════════════════════════════════════════════════
//  CANCELAR EDICIÓN
// ═══════════════════════════════════════════════════

function cancelarEdicion() {
  limpiarFormulario();
  mostrarToast('Edición cancelada.', '');
}

// ═══════════════════════════════════════════════════
//  LIMPIAR FORMULARIO — FUNCIÓN REUTILIZABLE
// ═══════════════════════════════════════════════════

/**
 * Resetea todos los campos del formulario y su estado visual.
 */
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

// ═══════════════════════════════════════════════════
//  BUSCAR / FILTRAR — FUNCIÓN REUTILIZABLE
// ═══════════════════════════════════════════════════

/**
 * Filtra el arreglo mascotas según texto buscado y tipo seleccionado.
 * @returns {Array} Sub-arreglo con las mascotas que coinciden
 */
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

// ═══════════════════════════════════════════════════
//  CHIPS DE FILTRO RÁPIDO
// ═══════════════════════════════════════════════════

/**
 * Activa el chip seleccionado y actualiza el filtro de tipo.
 * @param {HTMLElement} el  - El chip clickeado
 * @param {string}      tipo - Valor del tipo a filtrar
 */
function setChip(el, tipo) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sel-filtro-tipo').value = tipo;
  renderLista();
}

// ═══════════════════════════════════════════════════
//  RENDER LISTA — MANIPULACIÓN DEL DOM
// ═══════════════════════════════════════════════════

/**
 * Genera dinámicamente las tarjetas de mascotas en el DOM.
 * Aplica los filtros activos antes de renderizar.
 */
function renderLista() {
  const grid  = document.getElementById('pet-grid');
  const lista = filtrarMascotas();

  // Limpiar el contenedor
  grid.innerHTML = '';

  // Estado vacío
  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h5>No hay mascotas registradas</h5>
        <p>Agrega la primera mascota usando el formulario.</p>
      </div>`;
    return;
  }

  // Crear una tarjeta por cada mascota filtrada
  lista.forEach((m, i) => {
    const idxReal = mascotas.indexOf(m); // índice real en el arreglo original
    const emoji   = EMOJIS[m.tipo]        || '🐾';
    const avClass = AVATAR_CLASSES[m.tipo] || 'avatar-otro';

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

    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════
//  ESTADÍSTICAS DEL HEADER
// ═══════════════════════════════════════════════════

/**
 * Actualiza los contadores del header: total de mascotas y dueños únicos.
 */
function actualizarStats() {
  document.getElementById('stat-total').textContent = mascotas.length;

  // Contar dueños únicos usando un Set
  const duenos = new Set(mascotas.map(m => m.dueno.toLowerCase()));
  document.getElementById('stat-duenos').textContent = duenos.size;

  // Sincronizar contadores del menú móvil
  const tm = document.getElementById('stat-total-m');
  const dm = document.getElementById('stat-duenos-m');
  if (tm) tm.textContent = mascotas.length;
  if (dm) dm.textContent = duenos.size;
}

// ═══════════════════════════════════════════════════
//  TOAST — FUNCIÓN REUTILIZABLE
// ═══════════════════════════════════════════════════

/**
 * Muestra una notificación temporal en la esquina inferior derecha.
 * @param {string} msg  - Mensaje a mostrar
 * @param {string} tipo - 'success' | 'error' | 'warn' | ''
 */
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

  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    t.style.opacity    = '0';
    t.style.transition = 'opacity .4s';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

// ═══════════════════════════════════════════════════
//  UTILIDAD — Protección contra XSS
// ═══════════════════════════════════════════════════

/**
 * Escapa caracteres especiales HTML para evitar inyección de código.
 * @param {string} str - Texto a escapar
 * @returns {string} Texto seguro para insertar en el DOM
 */
function escapar(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════
//  INICIALIZACIÓN
// ═══════════════════════════════════════════════════

cargarStorage();   // 1. Cargar datos desde localStorage
renderLista();     // 2. Renderizar tarjetas en el DOM
actualizarStats(); // 3. Actualizar contadores del header
