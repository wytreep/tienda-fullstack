
console.log("admin.js cargando...")
console.log("token:", localStorage.getItem("admin-token"))
console.log("usuario:", localStorage.getItem("admin-usuario"))
const API = "https://mi-servidor-2mff.onrender.com"

const token = localStorage.getItem("admin-token")
const usuario = JSON.parse(localStorage.getItem("admin-usuario"))

if (!token || !usuario || (usuario.rol !== "admin" && usuario.rol !== "superadmin")) {
    window.location.href = "admin-login.html"
}
const esSuperAdmin = usuario.rol === "superadmin"
// Inicializar avatar y rol en sidebar
const inicial = usuario.nombre.charAt(0).toUpperCase()
document.getElementById("adminAvatar").textContent = inicial
document.getElementById("adminRol").textContent = esSuperAdmin ? "Super Admin" : "Administrador"

if (esSuperAdmin) {
    document.getElementById("configDirecta").style.display = "block"
} else {
    document.getElementById("configSolicitud").style.display = "block"
}

document.getElementById("adminNombre").textContent = "Admin " + usuario.nombre

document.getElementById("btnCerrarSesion").addEventListener("click", function() {
    localStorage.removeItem("admin-token")
    localStorage.removeItem("admin-usuario")
    window.location.href = "admin-login.html"
})

//Cambio directo (superadmin)
async function cambiarDatoDirecto(campo, inputId) {
    const valor = document.getElementById(inputId).value.trim()
    if (!valor) {
        mostrarToast("Escribe un valor", true)
        return
    }

    const respuesta = await fetch(API + "/auth/cambiar-dato", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ campo, valor })
    })

    const datos = await respuesta.json()
    if (respuesta.ok) {
        mostrarToast("✓ " + datos.mensaje)
        document.getElementById(inputId).value = ""
    } else {
        mostrarToast(datos.error, true)
    }
}

// Navegación
function mostrarSeccion(nombre, event) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activo"))
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("activo"))
    document.getElementById("seccion-" + nombre).classList.add("activo")

    const titulos = {
        dashboard: "Dashboard", ventas: "Ventas", productos: "Productos",
        pedidos: "Pedidos", resenas: "Reseñas", usuarios: "Usuarios",
        invitaciones: "Invitaciones", configuracion: "Configuración"
    }

    document.getElementById("tituloSeccion").textContent = titulos[nombre] || nombre
    document.getElementById("breadcrumbActual").textContent = titulos[nombre] || nombre

    if (event && event.target) event.target.classList.add("activo")

    if (nombre === "dashboard") cargarEstadisticas()
    if (nombre === "productos") cargarProductos()
    if (nombre === "pedidos") cargarPedidos()
    if (nombre === "usuarios") cargarUsuarios()
    if (nombre === "ventas") cargarVentas()
    if (nombre === "resenas") cargarResenas()
    if (nombre === "invitaciones") cargarSolicitudes()
}

async function solicitarCambio(campo, inputId) {
    const valor_nuevo = document.getElementById(inputId).value.trim()
    if (!valor_nuevo) {
        mostrarToast("Escribe un valor", true)
        return
    }

    const respuesta = await fetch(API + "/solicitudes-cambio", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ campo, valor_nuevo })
    })

    const datos = await respuesta.json()

    if (respuesta.ok) {
        mostrarToast("✓ Solicitud enviada al superadmin")
        document.getElementById(inputId).value = ""
    } else {
        mostrarToast(datos.error, true)
    }
}

// Dashboard
    async function cargarEstadisticas() {
        const r = await fetch(API + "/estadisticas", {
            headers: { "authorization": token }
        })
        const stats = await r.json()
        document.getElementById("statProductos").textContent = stats.productos
        document.getElementById("statPedidos").textContent = stats.pedidos
        document.getElementById("statUsuarios").textContent = stats.usuarios
        document.getElementById("statVentas").textContent = "$" + Number(stats.ventas).toLocaleString()
        cargarPedidosRecientes()
    }

    async function cargarPedidosRecientes() {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        const tbody = document.getElementById("tbodyPedidosRecientes")
        const recientes = pedidos.slice(0, 5)

        tbody.innerHTML = recientes.map(function(p) {
            return `
                <tr>
                    <td>#${p.id}</td>
                    <td>${p.usuario}</td>
                    <td>$${Number(p.total).toLocaleString()}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>${new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
            `
        }).join("")
    }

        let ultimaRevision = new Date().toISOString()

    async function verificarCancelaciones() {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        const cancelados = pedidos.filter(p => 
            p.estado === "cancelado" && 
            new Date(p.created_at) > new Date(ultimaRevision)
        )

        cancelados.forEach(function(p) {
            mostrarToast(`❌ Pedido #${p.id} de ${p.usuario} fue cancelado`, true)
        })

        if (cancelados.length) ultimaRevision = new Date().toISOString()
    }

    setInterval(verificarCancelaciones, 10000)

    async function cargarVentas() {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()

        const total = pedidos.reduce((sum, p) => sum + Number(p.total), 0)
        const promedio = pedidos.length ? total / pedidos.length : 0
        const entregados = pedidos.filter(p => p.estado === "entregado").length
        const pendientes = pedidos.filter(p => p.estado === "pendiente").length

        document.getElementById("ventaTotal").textContent = "$" + total.toLocaleString()
        document.getElementById("ventaPromedio").textContent = "$" + Math.round(promedio).toLocaleString()
        document.getElementById("ventaEntregados").textContent = entregados
        document.getElementById("ventaPendientes").textContent = pendientes

        const tbody = document.getElementById("tbodyVentas")
        tbody.innerHTML = pedidos.map(function(p) {
            return `
                <tr>
                    <td>#${p.id}</td>
                    <td>${p.usuario}</td>
                    <td>$${Number(p.total).toLocaleString()}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                    <td>${new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
            `
        }).join("")
    }
// Productos
async function cargarProductos() {
    const r = await fetch(API + "/productos", {
        headers: { "authorization": token }
    })
    const productos = await r.json()
    const tbody = document.getElementById("tbodyProductos")
    tbody.innerHTML = ""

    productos.forEach(function(p) {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${p.imagen ? `<img src="${API}${p.imagen}">` : "📦"}</td>
            <td>${p.nombre}</td>
            <td>$${Number(p.precio).toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>${p.categoria || "-"}</td>
            <td>
                <button class="btn-accion btn-editar" onclick="editarProducto(${p.id})">Editar</button>
                <button class="btn-accion btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
            </td>
        `
        tbody.appendChild(tr)
    })
}

function mostrarFormProducto() {
    document.getElementById("vistaTabla").style.display = "none"
    document.getElementById("vistaFormulario").style.display = "block"
    document.getElementById("formTitulo").textContent = "Agregar producto"
    document.getElementById("productoId").value = ""
    document.getElementById("pNombre").value = ""
    document.getElementById("pPrecio").value = ""
    document.getElementById("pStock").value = ""
    document.getElementById("pCategoria").value = ""
    document.getElementById("pDescripcion").value = ""
}

function cancelarFormProducto() {
    document.getElementById("vistaTabla").style.display = "block"
    document.getElementById("vistaFormulario").style.display = "none"
}

async function editarProducto(id) {
    const r = await fetch(API + "/productos/" + id, {
        headers: { "authorization": token }
    })
    const p = await r.json()
    document.getElementById("vistaTabla").style.display = "none"
    document.getElementById("vistaFormulario").style.display = "block"
    document.getElementById("formTitulo").textContent = "Editar producto"
    document.getElementById("productoId").value = p.id
    document.getElementById("pNombre").value = p.nombre
    document.getElementById("pPrecio").value = p.precio
    document.getElementById("pStock").value = p.stock
    document.getElementById("pCategoria").value = p.categoria || ""
    document.getElementById("pDescripcion").value = p.descripcion || ""
}

async function guardarProducto() {
    const id = document.getElementById("productoId").value
    const formData = new FormData()
    formData.append("nombre", document.getElementById("pNombre").value)
    formData.append("precio", document.getElementById("pPrecio").value)
    formData.append("stock", document.getElementById("pStock").value)
    formData.append("categoria", document.getElementById("pCategoria").value)
    formData.append("descripcion", document.getElementById("pDescripcion").value)

    const imagen = document.getElementById("pImagen").files[0]
    if (imagen) formData.append("imagen", imagen)

    const metodo = id ? "PUT" : "POST"
    const url = id ? API + "/productos/" + id : API + "/productos"

    const r = await fetch(url, {
        method: metodo,
        headers: { "authorization": token },
        body: formData
    })

    if (r.ok) {
        cancelarFormProducto()
        cargarProductos()
        mostrarToast("✓ Producto guardado correctamente")
    }
}
async function eliminarProducto(id) {
    if (!confirm("¿Seguro que desea eliminar este producto?")) return
    await fetch(API + "/productos/" + id, {
        method: "DELETE",
        headers: { "authorization": token }
    })
    cargarProductos()
    mostrarToast("✓ Producto eliminado")
}

// Pedidos
async function cargarPedidos() {
    const r = await fetch(API + "/pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await r.json()
    const tbody = document.getElementById("tbodyPedidos")
    tbody.innerHTML = ""

    pedidos.forEach(function(p) {
        const direccionCompleta = p.tipo_envio === "nacional"
            ? `${p.direccion}, ${p.barrio}, ${p.ciudad}, ${p.departamento}`
            : `${p.direccion}, ${p.barrio}`

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>#${p.id}</td>
            <td>
                <div>${p.usuario}</div>
                <div style="font-size:0.75rem;color:#888">${p.email_usuario}</div>
            </td>
            <td>$${Number(p.total).toLocaleString()}</td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
            <td>
                <div style="font-size:0.8rem">
                    <div><b>${p.destinatario || '-'}</b> · CC: ${p.cedula || '-'}</div>
                    <div>📞 ${p.telefono || '-'}</div>
                    <div>📍 ${p.direccion ? direccionCompleta : 'Sin dirección'}</div>
                    ${p.indicaciones ? `<div style="color:#888">💬 ${p.indicaciones}</div>` : ''}
                    <div style="margin-top:2px"><span class="badge ${p.tipo_envio === 'nacional' ? 'badge-enviado' : 'badge-entregado'}">${p.tipo_envio || 'nacional'}</span></div>
                </div>
            </td>
            <td>${new Date(p.created_at).toLocaleDateString()}</td>
            <td>
                <select class="select-estado" onchange="cambiarEstadoPedido(${p.id}, this.value)">
                    <option ${p.estado === 'pendiente' ? 'selected' : ''} value="pendiente">Pendiente</option>
                    <option ${p.estado === 'procesando' ? 'selected' : ''} value="procesando">Procesando</option>
                    <option ${p.estado === 'empacado' ? 'selected' : ''} value="empacado">Empacado</option>
                    <option ${p.estado === 'enviado' ? 'selected' : ''} value="enviado">Enviado</option>
                    <option ${p.estado === 'entregado' ? 'selected' : ''} value="entregado">Entregado</option>
                    <option ${p.estado === 'cancelado' ? 'selected' : ''} value="cancelado">Cancelado</option>
                </select>
            </td>
        `
        tbody.appendChild(tr)
    })
}

async function cargarResenas() {
    
    const r = await fetch(API + "/resenas", {
        headers: { "authorization": token }
    })
    const resenas = await r.json()
    const tbody = document.getElementById("tbodyResenas")

    if (!resenas.length) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;color:#888'>No hay reseñas</td></tr>"
        return
    }

    tbody.innerHTML = resenas.map(function(r) {
        const estrellas = "★".repeat(r.calificacion) + "☆".repeat(5 - r.calificacion)

        const respuestasHTML = r.respuestas.length ? r.respuestas.map(function(resp) {
            return `<div style="font-size:0.75rem; color:#888; margin-top:4px">
                        ${resp.es_admin ? '🏪' : '👤'} <b>${resp.nombre}:</b> ${resp.comentario}
                    </div>`
        }).join("") : ""

        return `
            <tr>
                <td>${r.producto}</td>
                <td>${r.usuario}</td>
                <td style="color:#f59e0b">${estrellas} (${r.likes} 👍)</td>
                <td>
                    <div>${r.comentario}</div>
                    ${respuestasHTML}
                </td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td style="display:flex; gap:0.5rem; flex-wrap:wrap">
                    <button class="btn-edit" onclick="toggleLikeAdmin(${r.id}, this)">👍 Like</button>
                    <button class="btn-edit" onclick="toggleRespuestaAdmin(${r.id})">💬 Responder</button>
                    <button class="btn-delete" onclick="eliminarResena(${r.id})">Eliminar</button>
                </td>
            </tr>
            <tr id="form-admin-respuesta-${r.id}" style="display:none">
                <td colspan="6" style="padding:0.75rem 1rem; background:#f8fafc">
                    <div style="display:flex; gap:0.5rem; align-items:center">
                        <input type="text" id="input-admin-respuesta-${r.id}" 
                            placeholder="Escribe tu respuesta como admin..." 
                            style="flex:1; padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:0.875rem; outline:none">
                        <button class="btn-primary" onclick="enviarRespuestaAdmin(${r.id})">Enviar</button>
                    </div>
                </td>
            </tr>
        `
    }).join("")
}
async function toggleLikeAdmin(resenaId, btn) {
    const respuesta = await fetch(API + "/resenas/" + resenaId + "/like", {
        method: "POST",
        headers: { "authorization": token }
    })
    const datos = await respuesta.json()
    if (respuesta.ok) {
        btn.style.color = datos.liked ? "#2563eb" : ""
        mostrarToast(datos.liked ? "👍 Like agregado" : "Like quitado")
    }
}

function toggleRespuestaAdmin(resenaId) {
    const form = document.getElementById("form-admin-respuesta-" + resenaId)
    form.style.display = form.style.display === "none" ? "table-row" : "none"
}

async function enviarRespuestaAdmin(resenaId) {
    const comentario = document.getElementById("input-admin-respuesta-" + resenaId).value.trim()
    if (!comentario) {
        mostrarToast("Escribe una respuesta", true)
        return
    }

    const respuesta = await fetch(API + "/resenas/" + resenaId + "/respuestas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ comentario })
    })

    if (respuesta.ok) {
        mostrarToast("✓ Respuesta enviada")
        document.getElementById("input-admin-respuesta-" + resenaId).value = ""
        document.getElementById("form-admin-respuesta-" + resenaId).style.display = "none"
    }
}
async function eliminarResena(id) {
    if (!confirm("¿Eliminar esta reseña?")) return
    const r = await fetch(API + "/resenas/" + id, {
        method: "DELETE",
        headers: { "authorization": token }
    })
    if (r.ok) {
        mostrarToast("✓ Reseña eliminada")
        cargarResenas()
    }
}

async function cambiarEstadoPedido(id, estado) {
    await fetch(API + "/pedidos/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ estado })
    })
    mostrarToast("✓ Estado actualizado")
}

// Usuarios
async function cargarUsuarios() {
    const r = await fetch(API + "/usuarios", {
        headers: { "authorization": token }
    })
    const usuarios = await r.json()
    const tbody = document.getElementById("tbodyUsuarios")
    tbody.innerHTML = ""

        usuarios.forEach(function(u) {
            const tr = document.createElement("tr")
            const esMiCuenta = u.id === usuario.id
            const esSuperAdminUsuario = u.rol === "superadmin"

            tr.innerHTML = `
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
                <td>
                    ${!esMiCuenta && !esSuperAdminUsuario ? `
                        <button class="btn-rol" onclick="cambiarRol(${u.id}, '${u.rol}')">
                            ${u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                    ` : "-"}
                </td>
            `
            tbody.appendChild(tr)
    })
}

async function cambiarRol(id, rolActual) {
    const nuevoRol = rolActual === "admin" ? "usuario" : "admin"
    await fetch(API + "/usuarios/" + id + "/rol", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ rol: nuevoRol })
    })
    cargarUsuarios()
    mostrarToast("✓ Rol actualizado")
}
async function generarInvitacion() {
    const email = document.getElementById("emailInvitacion").value.trim()
    if (!email) {
        mostrarToast("Escribe un email", true)
        return
    }

    const respuesta = await fetch(API + "/invitaciones", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ email })
    })

    const datos = await respuesta.json()

    if (respuesta.ok) {
        document.getElementById("linkGenerado").style.display = "block"
        document.getElementById("linkInvitacion").value = datos.link
        mostrarToast("✓ Link generado correctamente")
    } else {
        mostrarToast(datos.error, true)
    }
}

function copiarLink() {
    const link = document.getElementById("linkInvitacion")
    link.select()
    document.execCommand("copy")
    mostrarToast("✓ Link copiado")
}

async function cargarSolicitudes() {
    const respuesta = await fetch(API + "/solicitudes-cambio", {
        headers: { "authorization": token }
    })
    const solicitudes = await respuesta.json()
    const tbody = document.getElementById("tbodySolicitudes")

    if (!solicitudes.length) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;color:#888'>No hay solicitudes pendientes</td></tr>"
        return
    }

    tbody.innerHTML = solicitudes.map(function(s) {
        const valor = s.campo === "password" ? "••••••••" : s.valor_nuevo
        return `
            <tr>
                <td>${s.nombre}</td>
                <td>${s.email}</td>
                <td>${s.campo}</td>
                <td>${valor}</td>
                <td>${new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-edit" onclick="responderSolicitud(${s.id}, 'aprobado')">✓ Aprobar</button>
                    <button class="btn-delete" onclick="responderSolicitud(${s.id}, 'rechazado')">✕ Rechazar</button>
                </td>
            </tr>
        `
    }).join("")
}

async function responderSolicitud(id, estado) {
    const respuesta = await fetch(API + "/solicitudes-cambio/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ estado })
    })

    if (respuesta.ok) {
        mostrarToast(estado === "aprobado" ? "✓ Solicitud aprobada" : "Solicitud rechazada")
        cargarSolicitudes()
    }
}

function mostrarToast(mensaje) {
    let toast = document.getElementById("toast")
    if (!toast) {
        toast = document.createElement("div")
        toast.id = "toast"
        toast.style.cssText = `
            position:fixed; bottom:2rem; right:2rem;
            background:#22c55e; color:#fff;
            padding:12px 24px; border-radius:8px;
            font-weight:500; z-index:9999;
            opacity:0; transform:translateY(20px);
            transition:all 0.3s ease;
        `
        document.body.appendChild(toast)
    }
    toast.textContent = mensaje
    toast.style.opacity = "1"
    toast.style.transform = "translateY(0)"
    setTimeout(function() {
        toast.style.opacity = "0"
        toast.style.transform = "translateY(20px)"
    }, 3000)
}

// ===== FUNCIONES NUEVAS PARA EL DISEÑO UNIVIRTUAL =====

// Actualizar estadísticas del dashboard con más detalles
async function cargarEstadisticasCompletas() {
    try {
        const r = await fetch(API + "/estadisticas", {
            headers: { "authorization": token }
        });
        const stats = await r.json();
        
        // Actualizar números principales
        document.getElementById("statProductos").textContent = stats.productos;
        document.getElementById("statPedidos").textContent = stats.pedidos;
        document.getElementById("statUsuarios").textContent = stats.usuarios;
        document.getElementById("statVentas").textContent = "$" + Number(stats.ventas).toLocaleString();
        
        // Calcular pedidos pendientes
        const pedidosR = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        });
        const pedidos = await pedidosR.json();
        const pendientes = pedidos.filter(p => p.estado === "pendiente" || p.estado === "procesando").length;
        document.getElementById("statPedidosPendientes").textContent = pendientes + " pendientes";
        
        // Ventas del mes (simulado - puedes ajustar con lógica real)
        const ventasMes = Math.round(stats.ventas * 0.3); // 30% del total como ejemplo
        document.getElementById("statVentasMes").textContent = "$" + ventasMes.toLocaleString() + " este mes";
        
        // Actualizar badge de pedidos en sidebar
        if (pendientes > 0) {
            const badge = document.getElementById("navPedidosBadge");
            badge.textContent = pendientes;
            badge.style.display = "inline";
        }
        
        // Cargar top productos
        await cargarTopProductos();
        
        // Actualizar progreso del mes
        actualizarProgresoMes(stats);
        
    } catch (error) {
        console.error("Error cargando estadísticas:", error);
    }
}

// Cargar productos más vendidos (top 5)
async function cargarTopProductos() {
    try {
        const r = await fetch(API + "/productos", {
            headers: { "authorization": token }
        });
        const productos = await r.json();
        
        // Ordenar por ventas (asumiendo que tienes un campo ventas)
        // Si no, usar stock como proxy o pedidos
        const topProductos = productos.slice(0, 5).map((p, index) => {
            const colores = ["#2560a8", "#1e7d4e", "#b8922a", "#7d3c98", "#c0392b"];
            return {
                ...p,
                color: colores[index % colores.length],
                progreso: Math.min(100, Math.round((p.stock / 100) * 100)) // Ejemplo
            };
        });
        
        const container = document.getElementById("topProductos");
        if (!container) return;
        
        container.innerHTML = topProductos.map(p => `
            <div class="materia-item" onclick="editarProducto(${p.id})" style="cursor:pointer;">
                <div class="materia-color" style="background:${p.color};"></div>
                <div class="materia-info">
                    <div class="materia-name">${p.nombre}</div>
                    <div class="materia-prof">Stock: ${p.stock} unidades</div>
                </div>
                <div class="materia-right">
                    <div class="materia-progress-wrap">
                        <div class="materia-progress" style="width:${p.progreso}%; background:${p.color};"></div>
                    </div>
                    <div class="materia-pct">$${Number(p.precio).toLocaleString()}</div>
                </div>
            </div>
        `).join("");
        
    } catch (error) {
        console.error("Error cargando top productos:", error);
    }
}

// Actualizar el anillo de progreso
function actualizarProgresoMes(stats) {
    const metaMensual = 60000000; // $60M como ejemplo
    const ventasActuales = stats.ventas || 0;
    const progreso = Math.min(100, Math.round((ventasActuales / metaMensual) * 100));
    
    // Actualizar anillo SVG
    const ring = document.getElementById("progresoRing");
    if (ring) {
        const circumference = 2 * Math.PI * 45; // 2πr, r=45
        const offset = circumference - (progreso / 100) * circumference;
        ring.style.strokeDasharray = `${circumference}`;
        ring.style.strokeDashoffset = offset;
    }
    
    // Actualizar textos
    document.getElementById("progresoPct").textContent = progreso + "%";
    document.getElementById("ventasMesVal").textContent = "$" + Number(ventasActuales).toLocaleString();
    document.getElementById("metaMensualVal").textContent = "$" + metaMensual.toLocaleString();
    
    // Calcular pedidos completados (ejemplo)
    fetch(API + "/pedidos", { headers: { "authorization": token } })
        .then(r => r.json())
        .then(pedidos => {
            const completados = pedidos.filter(p => p.estado === "entregado").length;
            document.getElementById("pedidosCompletadosVal").textContent = completados;
        });
}

// Actualizar avatar en topbar
function actualizarAvatarTopbar() {
    const usuario = JSON.parse(localStorage.getItem("admin-usuario") || "{}");
    const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "A";
    
    const smallAvatar = document.getElementById("adminAvatarSmall");
    if (smallAvatar) {
        smallAvatar.textContent = inicial;
    }
    
    const smallName = document.getElementById("adminNombreSmall");
    if (smallName) {
        smallName.textContent = usuario.nombre || "Admin";
    }
}

// Mostrar/ocultar secciones de admin según rol
function configurarVisibilidadPorRol() {
    const usuario = JSON.parse(localStorage.getItem("admin-usuario") || "{}");
    const esSuperAdmin = usuario.rol === "superadmin";
    
    const adminGroup = document.getElementById("navAdminGroup");
    if (adminGroup) {
        adminGroup.style.display = esSuperAdmin ? "block" : "none";
    }
}

// Sobrescribir la función cargarEstadisticas original para usar la nueva
const cargarEstadisticasOriginal = cargarEstadisticas;
cargarEstadisticas = async function() {
    await cargarEstadisticasCompletas();
    if (typeof cargarPedidosRecientes === "function") {
        await cargarPedidosRecientes();
    }
};

// Inicializar todo al cargar
document.addEventListener("DOMContentLoaded", function() {
    configurarVisibilidadPorRol();
    actualizarAvatarTopbar();
    
    // Si estamos en dashboard, cargar stats completas
    if (document.getElementById("seccion-dashboard").classList.contains("active")) {
        cargarEstadisticasCompletas();
    }
});

// También necesitamos mantener la función original para otras secciones
window.cargarEstadisticas = cargarEstadisticas;

// Cargar dashboard al iniciar
cargarEstadisticas()