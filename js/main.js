// --- CONFIGURACIÓN DE SUPABASE (CAMBIA ESTO CON TUS LLAVES) ---
const SB_URL = 'https://nbfephqfbszsjjfbxnbr.supabase.co';
const SB_KEY = 'sb_publishable_qJa2_h7LePnvAU1X7AjppA_4STY5l-B';
const supabase = supabase.createClient(SB_URL, SB_KEY);

const REGIONES = [
    { id: 1, name: "MONDSTADT", desc: "Modelado y Normalización", bg: "https://images6.alphacoders.com/110/1105432.jpg" },
    { id: 2, name: "LIYUE", desc: "Lenguaje SQL y Consultas", bg: "https://images.alphacoders.com/112/1123447.jpg" },
    { id: 3, name: "INAZUMA", desc: "Triggers y Procedimientos", bg: "https://images2.alphacoders.com/116/1167440.jpg" },
    { id: 4, name: "SUMERU", desc: "Optimización y Diseño Físico", bg: "https://images8.alphacoders.com/124/1243171.jpg" }
];

document.addEventListener('DOMContentLoaded', function() {
    renderRegiones();
    verificarAdmin();

    // Lógica de Login
    document.getElementById('authBtn').onclick = function() {
        if(localStorage.getItem('isAdmin')) {
            localStorage.removeItem('isAdmin');
            location.reload();
        } else {
            if(prompt("Clave de Administrador:") === "1234") {
                localStorage.setItem('isAdmin', 'true');
                location.reload();
            }
        }
    };
});

function renderRegiones() {
    const world = document.getElementById('world-container');
    if (!world) return;
    REGIONES.forEach(r => {
        const section = document.createElement('section');
        section.className = "unit-banner";
        section.style.backgroundImage = "url('" + r.bg + "')";
        section.innerHTML = '<div class="unit-overlay">' +
            '<h1 class="unit-title Cinzel">' + r.name + '</h1>' +
            '<button class="btn-genshin-sm mt-3" onclick="abrirRegion(' + r.id + ', \'' + r.name + '\')">EXPLORAR</button>' +
            '</div>';
        world.appendChild(section);
    });
}

window.abrirRegion = async function(id, nombre) {
    document.getElementById('modalUnitTitle').innerText = "RECURSOS DE " + nombre;
    const list = document.getElementById('weeks-list');
    list.innerHTML = "<p class='text-center'>Conectando con la nube de Celestia...</p>";
    
    const isAdmin = localStorage.getItem('isAdmin');

    // TRAER ARCHIVOS DESDE SUPABASE
    const { data: recursos, error } = await supabase
        .from('recursos')
        .select('*')
        .eq('unidad_id', id);

    list.innerHTML = "";
    // Creamos 4 banners verticales (uno por semana)
    for (let i = 1; i <= 4; i++) {
        const banner = document.createElement('div');
        banner.className = "week-banner shadow";
        
        let fileHtml = "";
        if (recursos) {
            // Filtramos archivos por unidad (aquí puedes mejorar el filtro por semana si gustas)
            recursos.forEach(res => {
                fileHtml += '<div class="d-flex justify-content-between align-items-center mb-2">' +
                    '<a href="' + res.url + '" target="_blank" class="text-white small" style="text-decoration:none">📄 ' + res.nombre + '</a>' +
                    (isAdmin ? '<div>' +
                        '<span class="text-info me-2" style="cursor:pointer; font-size:10px" onclick="editarRecurso(\''+res.id+'\')">EDITAR</span>' +
                        '<span class="text-danger" style="cursor:pointer; font-size:10px" onclick="eliminarRecurso(\''+res.id+'\', \''+res.ruta_storage+'\')">X</span>' +
                    '</div>' : '') +
                '</div>';
            });
        }

        banner.innerHTML = '<div class="week-banner-overlay">' +
            '<div class="week-number">SESIÓN SEMANA ' + i + '</div>' +
            '<div class="my-3" style="max-height:200px; overflow-y:auto;">' + fileHtml + '</div>' +
            (isAdmin ? '<button class="btn-genshin-sm w-100" style="font-size:0.6rem" onclick="subirArchivoALaNube(' + id + ')">+ SUBIR ARCHIVO</button>' : '') +
            '</div>';
        list.appendChild(banner);
    }
    new bootstrap.Modal(document.getElementById('weekModal')).show();
};

// --- FUNCIONES DINÁMICAS (SUBIR, EDITAR, ELIMINAR) ---

window.subirArchivoALaNube = async function(unidadId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const nombreVisible = prompt("¿Qué nombre le ponemos al archivo?", file.name);
        const rutaStorage = 'u' + unidadId + '/' + Date.now() + '_' + file.name;

        // 1. Subir el archivo real al Storage de Supabase
        const { data, error } = await supabase.storage.from('recursos').upload(rutaStorage, file);
        if (error) return alert("Error al subir archivo: " + error.message);

        // 2. Obtener el link público del archivo
        const { data: urlPublica } = supabase.storage.from('recursos').getPublicUrl(rutaStorage);

        // 3. Guardar el nombre y el link en la tabla de la Base de Datos
        await supabase.from('recursos').insert([{ 
            nombre: nombreVisible, 
            url: urlPublica.publicUrl, 
            unidad_id: unidadId,
            ruta_storage: rutaStorage 
        }]);
        
        location.reload();
    };
    input.click();
};

window.eliminarRecurso = async function(id, ruta) {
    if(confirm("¿Eliminar este archivo permanentemente?")) {
        await supabase.storage.from('recursos').remove([ruta]);
        await supabase.from('recursos').delete().eq('id', id);
        location.reload();
    }
};

window.editarRecurso = async function(id) {
    const nuevoNombre = prompt("Nuevo nombre para el archivo:");
    if(nuevoNombre) {
        await supabase.from('recursos').update({ nombre: nuevoNombre }).eq('id', id);
        location.reload();
    }
};

function verificarAdmin() {
    if (localStorage.getItem('isAdmin')) {
        document.getElementById('roleLabel').innerText = "MODO: ADMINISTRADOR";
        document.getElementById('roleLabel').classList.remove('d-none');
        document.getElementById('authBtn').innerText = "CERRAR SESIÓN";
    }
}