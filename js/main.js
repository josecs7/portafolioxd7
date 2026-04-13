const REGIONES = [
    { id: 1, name: "MONDSTADT", desc: "Modelado y Normalización", bg: "https://images6.alphacoders.com/110/1105432.jpg" },
    { id: 2, name: "LIYUE", desc: "Lenguaje SQL y Consultas", bg: "https://images.alphacoders.com/112/1123447.jpg" },
    { id: 3, name: "INAZUMA", desc: "Triggers y Procedimientos", bg: "https://images2.alphacoders.com/116/1167440.jpg" },
    { id: 4, name: "SUMERU", desc: "Optimización y Diseño Físico", bg: "https://images8.alphacoders.com/124/1243171.jpg" }
];

document.addEventListener('DOMContentLoaded', function() {
    var world = document.getElementById('world-container');

    // 1. Renderizar Unidades
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

    // 2. Abrir Modal de Recursos
    window.abrirRegion = function(id, nombre) {
        document.getElementById('modalUnitTitle').innerText = "RECURSOS DE " + nombre;
        var list = document.getElementById('weeks-list');
        list.innerHTML = "";
        var isAdmin = localStorage.getItem('userRole') === 'admin';

        for (var i = 1; i <= 4; i++) {
            var key = "u" + id + "w" + i;
            var files = JSON.parse(localStorage.getItem(key)) || [{n: "script_base.sql", r: "#"}];
            
            var banner = document.createElement('div');
            banner.className = "week-banner shadow";
            
            var fileHtml = "";
            files.forEach(function(file, idx) { 
                fileHtml += '<div class="d-flex justify-content-between align-items-center mb-2">' +
                    '<a href="' + file.r + '" target="_blank" style="text-decoration:none; color:#ece5d8;">📄 ' + file.n + '</a>' +
                    (isAdmin ? '<div style="font-size:10px">' +
                        '<span class="text-info me-2" style="cursor:pointer" onclick="editFile(\''+key+'\','+idx+')">EDITAR</span>' +
                        '<span class="text-danger" style="cursor:pointer" onclick="deleteFile(\''+key+'\','+idx+')">X</span>' +
                    '</div>' : '') +
                    '</div>'; 
            });

            banner.innerHTML = '<div class="week-banner-overlay">' +
                '<div class="week-number">SEMANA ' + (((id-1)*4)+i) + '</div>' +
                '<h5 class="Cinzel text-white mt-1">Sesión de Clase</h5>' +
                '<div id="box-' + key + '" class="my-2 small text-secondary">' + fileHtml + '</div>' +
                (isAdmin ? '<div class="mt-3 pt-2 border-top border-secondary text-center">' +
                    '<button class="btn-genshin-sm" style="font-size:0.6rem" onclick="addFile(\'' + key + '\')">+ AÑADIR RECURSO</button>' +
                '</div>' : '') +
                '</div>';
            list.appendChild(banner);
        }
        new bootstrap.Modal(document.getElementById('weekModal')).show();
    };

    // 3. Funciones CRUD
    window.addFile = function(key) {
        var name = prompt("Nombre visible del archivo:");
        var route = prompt("Ruta en GitHub (ej: recursos/practica1.sql):", "recursos/");
        if (name && route) {
            var cur = JSON.parse(localStorage.getItem(key)) || [];
            cur.push({n: name, r: route});
            localStorage.setItem(key, JSON.stringify(cur));
            location.reload();
        }
    };

    window.editFile = function(key, idx) {
        var cur = JSON.parse(localStorage.getItem(key));
        var newN = prompt("Nuevo nombre:", cur[idx].n);
        var newR = prompt("Nueva ruta:", cur[idx].r);
        if (newN && newR) {
            cur[idx] = {n: newN, r: newR};
            localStorage.setItem(key, JSON.stringify(cur));
            location.reload();
        }
    };

    window.deleteFile = function(key, idx) {
        if(confirm("¿Eliminar recurso?")) {
            var cur = JSON.parse(localStorage.getItem(key));
            cur.splice(idx, 1);
            localStorage.setItem(key, JSON.stringify(cur));
            location.reload();
        }
    };

    // 4. Autenticación (Login/Reg)
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

    // UI Admin Check
    if (localStorage.getItem('userRole') === 'admin') {
        document.getElementById('roleLabel').innerText = "MODO: ADMINISTRADOR";
        document.getElementById('roleLabel').classList.remove('d-none');
        document.getElementById('authBtn').innerText = "CERRAR SESIÓN";
    }
});