const REGIONES = [
    { id: 1, name: "UNIDAD I", desc: "Modelado y Normalización", bg: "img/uni1.jpeg" },
    { id: 2, name: "UNIDAD II", desc: "Lenguaje SQL y Consultas", bg: "img/uni2.jpeg" },
    { id: 3, name: "UNIDAD III", desc: "Triggers y Procedimientos", bg: "img/uni3.jpeg" },
    { id: 4, name: "UNIDAD IV", desc: "Optimización y Diseño Físico", bg: "img/uni4.jpeg" }
];

// 1. INICIALIZAR SUPABASE
const supabaseUrl = 'https://nbfephqfbszsjjfbxnbr.supabase.co';
const supabaseKey = 'sb_publishable_qJa2_h7LePnvAU1X7AjppA_4STY5l-B'; // Asegúrate de poner tu llave de la captura
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function() {
    var world = document.getElementById('world-container');

    // Renderizar Unidades
    if (world) {
        REGIONES.forEach(function(r) {
            var section = document.createElement('section');
            section.className = "unit-banner";
            section.style.backgroundImage = "url('" + r.bg + "')";
            section.innerHTML = '<div class="unit-overlay">' +
                '<h1 class="unit-title Cinzel">' + r.name + '</h1>' +
                '<p class="text-genshin-gold opacity-75">' + r.desc + '</p>' +
                '<button class="btn-genshin-sm mt-3" onclick="abrirRegion(' + r.id + ', \'' + r.name + '\')">EXPLORAR RECURSOS</button>' +
                '</div>';
            world.appendChild(section);
        });
    }

    // Abrir Modal de Recursos
    window.abrirRegion = function(id, nombre) {
        document.getElementById('modalUnitTitle').innerText = "RECURSOS DE " + nombre;
        var list = document.getElementById('weeks-list');
        list.innerHTML = "";
        var isAdmin = localStorage.getItem('userRole') === 'admin';

        for (var i = 1; i <= 4; i++) {
            var key = "u" + id + "w" + i;
            var files = JSON.parse(localStorage.getItem(key)) || []; // Se inicia vacío
            
            var banner = document.createElement('div');
            banner.className = "week-banner shadow";
            
            // LÓGICA DE DRAG AND DROP (Solo Admin)
            if (isAdmin) {
                let currentKey = key;
                let currentId = id;
                
                banner.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    this.style.borderColor = '#f4d03f';
                });
                
                banner.addEventListener('dragleave', function(e) {
                    e.preventDefault();
                    this.style.borderColor = 'rgba(236,229,216,0.2)';
                });
                
                banner.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.style.borderColor = 'rgba(236,229,216,0.2)';
                    // Toma los archivos arrastrados y los manda a subir
                    handleDropFiles(e.dataTransfer.files, currentKey, currentId);
                });
            }
            
            var fileHtml = "";
            if (files.length === 0) {
                fileHtml = "<p class='small text-secondary text-center mt-4'>Sin archivos</p>";
            } else {
                files.forEach(function(file, idx) { 
                    fileHtml += '<div class="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-1">' +
                        // target="_blank" asegura que el archivo se abra en otra pestaña
                        '<a href="' + file.r + '" target="_blank" style="text-decoration:none; color:#ece5d8; font-size:0.85rem; word-break: break-all;">📄 ' + file.n + '</a>' +
                        (isAdmin ? '<div style="font-size:10px; text-align:right; min-width: 30px;">' +
                            '<span class="text-danger fw-bold" style="cursor:pointer" onclick="deleteFile(\''+key+'\','+idx+')">X</span>' +
                        '</div>' : '') +
                        '</div>'; 
                });
            }

            // Diseño de la tarjeta con zona de arrastre
            banner.innerHTML = '<div class="week-banner-overlay d-flex flex-column" style="height:100%;">' +
                '<div class="week-number">SEMANA ' + (((id-1)*4)+i) + '</div>' +
                '<h5 class="Cinzel text-white mt-1">Sesión de Clase</h5>' +
                '<div id="box-' + key + '" class="my-2 flex-grow-1" style="overflow-y: auto;">' + fileHtml + '</div>' +
                (isAdmin ? '<div class="mt-auto pt-2 border-top border-secondary text-center">' +
                    '<p class="small text-genshin-accent mb-1" style="font-size:0.7rem;">⬇️ ARRASTRA ARCHIVOS AQUÍ ⬇️</p>' +
                    // Input múltiple oculto por si prefieren hacer clic
                    '<input type="file" multiple class="d-none" id="file-'+key+'" onchange="handleDropFiles(this.files, \''+key+'\', '+id+')">' +
                    '<button class="btn-genshin-sm w-100" style="font-size:0.6rem" onclick="document.getElementById(\'file-'+key+'\').click()">O SELECCIONAR</button>' +
                '</div>' : '') +
                '</div>';
            list.appendChild(banner);
        }
        new bootstrap.Modal(document.getElementById('weekModal')).show();
    };

    // FUNCION MAESTRA DE SUBIDA (Soporta múltiples archivos)
    window.handleDropFiles = async function(files, key, unidad_id) {
        if (!files || files.length === 0) return;
        
        let cur = JSON.parse(localStorage.getItem(key)) || [];
        alert(`Subiendo ${files.length} archivo(s)... Por favor no cierres la ventana.`);

        // Recorremos todos los archivos soltados
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let fileExt = file.name.split('.').pop();
            let uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            let filePath = `unidad_${unidad_id}/${uniqueName}`;

            // A) Subir al Storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('recursos')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Error subiendo", file.name, uploadError);
                continue; 
            }

            // B) Obtener URL
            const { data: publicUrlData } = supabaseClient.storage
                .from('recursos')
                .getPublicUrl(filePath);

            // C) Registrar en la BD 
            await supabaseClient.from('recursos').insert([
                { nombre: file.name, url: publicUrlData.publicUrl, unidad_id: unidad_id, ruta_storage: filePath }
            ]);

            // D) Guardar referencia en localStorage para la semana correspondiente
            cur.push({ n: file.name, r: publicUrlData.publicUrl, s_path: filePath });
        }

        // Guardar el arreglo actualizado y recargar para ver cambios
        localStorage.setItem(key, JSON.stringify(cur));
        location.reload(); 
    };

    // FUNCION DE BORRADO (Borra de Nube y Local)
    window.deleteFile = async function(key, idx) {
        if(confirm("¿Eliminar recurso permanentemente?")) {
            var cur = JSON.parse(localStorage.getItem(key));
            var fileData = cur[idx];
            
            // Si el archivo tiene ruta en Supabase, lo borramos del Storage y DB
            if (fileData.s_path) {
                await supabaseClient.storage.from('recursos').remove([fileData.s_path]);
                await supabaseClient.from('recursos').delete().eq('ruta_storage', fileData.s_path);
            }
            
            cur.splice(idx, 1);
            localStorage.setItem(key, JSON.stringify(cur));
            location.reload();
        }
    };

    // Autenticación (Login/Reg)
    document.getElementById('regBtn').onclick = function() {
        var u = prompt("Crea tu usuario:"); var p = prompt("Crea tu contraseña:");
        if(u && p) { localStorage.setItem('u', u); localStorage.setItem('p', p); alert("¡Viajero registrado!"); }
    };

    document.getElementById('authBtn').onclick = function() {
        if(localStorage.getItem('userRole') === 'admin') { localStorage.clear(); location.reload(); return; }
        var u = prompt("Usuario:"); var p = prompt("Contraseña:");
        if((u === localStorage.getItem('u') && p === localStorage.getItem('p')) || (u === 'admin' && p === '1234')) {
            localStorage.setItem('userRole', 'admin'); location.reload();
        } else { alert("Error de acceso."); }
    };

    if (localStorage.getItem('userRole') === 'admin') {
        document.getElementById('roleLabel').innerText = "MODO: ADMINISTRADOR";
        document.getElementById('roleLabel').classList.remove('d-none');
        document.getElementById('authBtn').innerText = "CERRAR SESIÓN";
    }
});