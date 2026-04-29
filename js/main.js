// ───────────────────────────────────────────────
// 1. NÚCLEO DE CONEXIÓN SUPABASE
// ───────────────────────────────────────────────
// Reemplaza estos valores con tus llaves reales de Supabase -> Settings > API
const supabaseUrl = 'https://nbfephqfbszsjjfbxnbr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmVwaHFmYnN6c2pqZmJ4bmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDkyODgsImV4cCI6MjA5MjM4NTI4OH0.kQUR94OfX4a4xOhqiIMCekGiBanytBMV2Mse9avd0tc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ───────────────────────────────────────────────
// 2. SISTEMA DE AUTENTICACIÓN (LOGIN/REGISTRO)
// ───────────────────────────────────────────────

/** Inicia sesión verificando credenciales en la tabla 'usuarios' **/
async function iniciarSesion() {
  const usuario = document.getElementById('input-usuario').value.trim();
  const password = document.getElementById('input-password').value.trim();
  const msgError = document.getElementById('msg-error');
  const msgExito = document.getElementById('msg-exito');

  if(msgError) msgError.style.display = 'none';
  if(msgExito) msgExito.style.display = 'none';

  if (!usuario || !password) {
    msgError.textContent = '> ERROR: CREDENCIALES_INCOMPLETAS'; 
    msgError.style.display = 'block'; 
    return;
  }

  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('password', password)
    .single();

  if (data) {
    localStorage.setItem('usuarioActivo', data.usuario);
    localStorage.setItem('rolActivo', data.rol);
    if(msgExito) msgExito.style.display = 'block';
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } else {
    msgError.textContent = '> ERROR: ACCESO_DENEGADO';
    msgError.style.display = 'block';
  }
}

/** Muestra/Oculta el panel de creación de nuevo usuario **/
function mostrarRegistro() {
  const panel = document.getElementById('panel-registro');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

/** Registra un nuevo operador en la base de datos **/
async function registrarUsuario() {
  const nuevoUsuario = document.getElementById('reg-usuario').value.trim();
  const nuevaPassword = document.getElementById('reg-password').value.trim();
  const msgError = document.getElementById('msg-reg-error');
  const msgExito = document.getElementById('msg-reg-exito');

  if(msgError) msgError.style.display = 'none'; 
  if(msgExito) msgExito.style.display = 'none';

  if (!nuevoUsuario || !nuevaPassword) {
    msgError.textContent = '> ERROR: CAMPOS_VACÍOS'; msgError.style.display = 'block'; return;
  }

  const { error } = await supabaseClient
    .from('usuarios')
    .insert([{ usuario: nuevoUsuario, password: nuevaPassword, rol: 'user' }]);

  if (error) {
    msgError.textContent = error.code === '23505' ? '> ERROR: ID_EXISTENTE' : '> ERROR: FALLO_DE_SISTEMA';
    msgError.style.display = 'block';
  } else {
    msgExito.textContent = '> REGISTRO_COMPLETADO';
    msgExito.style.display = 'block';
    document.getElementById('reg-usuario').value = '';
    document.getElementById('reg-password').value = '';
  }
}

// ───────────────────────────────────────────────
// 3. GESTIÓN DEL REPOSITORIO (STORAGE + DB)
// ───────────────────────────────────────────────

/** Crea una nueva semana y sube el archivo inicial **/
window.agregarSemana = async function() {
  const titulo = document.getElementById("titulo-semana").value;
  const descripcion = document.getElementById("descripcion-semana").value;
  const unidad = document.getElementById("unidad-semana").value;
  const archivoInput = document.getElementById("archivo-semana");

  if (!titulo || !descripcion || archivoInput.files.length === 0) { 
    alert("> ADVERTENCIA: PAYLOAD_INCOMPLETO"); return; 
  }
  
  const archivo = archivoInput.files[0];
  const uniqueName = `${Date.now()}_${archivo.name}`;
  const storagePath = `unidad_${unidad}/${uniqueName}`;

  // Protocolo para forzar apertura en pestaña nueva (especialmente .sql)
  let tipoArchivo = archivo.name.endsWith('.sql') ? 'text/plain' : (archivo.type || 'text/plain');

  // Subida al Storage Bucket 'recursos'
  const { error: uploadError } = await supabaseClient.storage.from('recursos').upload(storagePath, archivo, {
      contentType: tipoArchivo, cacheControl: '3600', upsert: false
  });
  
  if (uploadError) return alert("> ERROR: FALLO_AL_SUBIR_AL_STORAGE");

  const { data: publicUrlData } = supabaseClient.storage.from('recursos').getPublicUrl(storagePath);

  // Registro en tabla 'semanas'
  const nuevaSemana = {
    titulo, descripcion, unidad,
    trabajos: [{ nombre: archivo.name, url: publicUrlData.publicUrl, ruta_storage: storagePath }]
  };

  const { error } = await supabaseClient.from("semanas").insert([nuevaSemana]);
  if (error) alert("> ERROR: NO_SE_PUDO_REGISTRAR_EN_BD"); 
  else location.reload(); 
}

/** Carga y renderiza las tarjetas de cada unidad **/
async function cargarSemanas() {
  const { data, error } = await supabaseClient
    .from("semanas")
    .select("*")
    .order("unidad", { ascending: true })
    .order("titulo", { ascending: true });

  if (error) return;

  const rol = localStorage.getItem("rolActivo");

  data.forEach((s) => {
    const contenedor = document.getElementById(`unidad-${s.unidad}`);
    if(!contenedor) return;

    let trabajosHTML = "";
    (s.trabajos || []).forEach((t, idx) => {
      trabajosHTML += `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2" style="border: 1px solid var(--cp-red-dim); background: rgba(255,0,60,0.02);">
          <a href="${t.url}" target="_blank" class="text-decoration-none" style="color: var(--cp-cyan); font-size: 0.85rem; font-weight: bold;">> OPEN: ${t.nombre}</a>
          ${rol === 'admin' ? `<span class="text-danger fw-bold ms-2" style="cursor:pointer; font-size:11px;" onclick="eliminarTrabajoEspecifico('${s.id}', ${idx}, '${t.ruta_storage}')">[DEL]</span>` : ""}
        </div>`;
    });

    const div = document.createElement("div");
    div.className = "col-md-4 mb-4";
    div.innerHTML = `
      <div class="card p-3 h-100 text-white" style="border: 1px solid var(--cp-red); position: relative;">
        ${rol === "admin" ? `<span class="position-absolute top-0 end-0 m-2 text-danger fw-bold" style="cursor:pointer; font-size:1.2rem;" onclick="eliminarSemana('${s.id}')">&times;</span>` : ""}
        
        <h5 class="Cinzel text-genshin-accent mt-2">${s.titulo}</h5>
        <p class="small text-secondary flex-grow-1" style="opacity: 0.7;">${s.descripcion}</p>
        
        <div class="mt-2 mb-3">${trabajosHTML}</div>

        ${rol === "admin" ? `
          <div class="mt-auto d-flex gap-2">
            <button class="btn-genshin-sm w-50" style="font-size: 0.65rem; padding: 5px;" onclick="abrirEditar('${s.id}')">EDITAR</button>
            <input type="file" class="d-none" id="fileExtra-${s.id}" onchange="agregarTrabajoExtra(this.files, '${s.id}', '${s.unidad}')">
            <button class="btn-genshin-sm w-50" style="font-size: 0.65rem; padding: 5px; color: var(--cp-cyan); border-color: var(--cp-cyan);" onclick="document.getElementById('fileExtra-${s.id}').click()">+ FILE</button>
          </div>
        ` : ""}
      </div>
    `;
    contenedor.appendChild(div);
  });
}

/** Añade un archivo adicional a una tarjeta existente **/
window.agregarTrabajoExtra = async function(files, id, unidad) {
  if (!files || files.length === 0) return;
  const archivo = files[0];
  const storagePath = `unidad_${unidad}/${Date.now()}_${archivo.name}`;
  let tipoArchivo = archivo.name.endsWith('.sql') ? 'text/plain' : (archivo.type || 'text/plain');

  const { error: uploadError } = await supabaseClient.storage.from('recursos').upload(storagePath, archivo, { contentType: tipoArchivo });
  if (uploadError) return alert("> ERROR: FALLO_AL_SUBIR_EXTRA");

  const { data: publicUrlData } = supabaseClient.storage.from('recursos').getPublicUrl(storagePath);
  const { data } = await supabaseClient.from("semanas").select("trabajos").eq("id", id).single();
  
  let trabajos = data.trabajos || [];
  trabajos.push({ nombre: archivo.name, url: publicUrlData.publicUrl, ruta_storage: storagePath });

  const { error: updateError } = await supabaseClient.from("semanas").update({ trabajos }).eq("id", id);
  if (!updateError) location.reload(); 
}

/** Elimina una semana completa y sus archivos físicos en Storage **/
async function eliminarSemana(id) {
  if(!confirm("> ¿CONFIRMAR_BORRADO_TOTAL?")) return;
  const { data } = await supabaseClient.from("semanas").select("trabajos").eq("id", id).single();
  if (data && data.trabajos) {
    const rutas = data.trabajos.map(t => t.ruta_storage).filter(r => r);
    if (rutas.length > 0) await supabaseClient.storage.from('recursos').remove(rutas);
  }
  await supabaseClient.from("semanas").delete().eq("id", id);
  location.reload();
}

/** Elimina un solo archivo de una tarjeta **/
window.eliminarTrabajoEspecifico = async function(idSemana, index, rutaStorage) {
  if(!confirm("> ¿ELIMINAR_ARCHIVO?")) return;
  if (rutaStorage) await supabaseClient.storage.from('recursos').remove([rutaStorage]);
  const { data } = await supabaseClient.from("semanas").select("trabajos").eq("id", idSemana).single();
  let trabajos = data.trabajos;
  trabajos.splice(index, 1);
  await supabaseClient.from("semanas").update({ trabajos }).eq("id", idSemana);
  location.reload();
}

// ───────────────────────────────────────────────
// 4. MODALES DE EDICIÓN
// ───────────────────────────────────────────────
let idEditando = null;
window.abrirEditar = async function(id) {
  const { data, error } = await supabaseClient.from("semanas").select("*").eq("id", id).single();
  if (error) return;
  idEditando = id;
  document.getElementById("edit-titulo").value = data.titulo;
  document.getElementById("edit-descripcion").value = data.descripcion;
  document.getElementById("modal-editar").style.display = "block";
}

window.cerrarEditar = function() { document.getElementById("modal-editar").style.display = "none"; }

window.guardarEdicion = async function() {
  const nuevoTitulo = document.getElementById("edit-titulo").value;
  const nuevaDesc = document.getElementById("edit-descripcion").value;
  const { error } = await supabaseClient.from("semanas").update({ titulo: nuevoTitulo, descripcion: nuevaDesc }).eq("id", idEditando);
  if (!error) location.reload(); 
}

// ───────────────────────────────────────────────
// 5. INICIALIZADOR DE INTERFAZ HUD
// ───────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuarioActivo");
  const rol = localStorage.getItem("rolActivo");
  const panel = document.getElementById("panel-admin");
  const nombreNav = document.getElementById('navbar-nombre');
  const btnAuth = document.getElementById('btn-auth');

  if (usuario) {
    if (nombreNav) {
      nombreNav.innerHTML = `SYS_DB <span class="text-genshin-accent">[II]</span> <span style="font-size: 0.75rem; font-weight: normal; color: var(--cp-cyan);">// ID: ${usuario.toUpperCase()}</span>`;
    }
    if (btnAuth) {
      btnAuth.textContent = 'SYS_LOGOUT';
      btnAuth.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
      });
    }
  }

  if (rol === "admin" && panel) panel.style.display = "block";
  if (document.getElementById("trabajos")) cargarSemanas();
});