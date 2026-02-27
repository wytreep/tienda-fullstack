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
document.addEventListener("DOMContentLoaded", function() {
    const adminAvatar = document.getElementById("adminAvatar")
    const adminRol = document.getElementById("adminRol")
    const adminNombre = document.getElementById("adminNombre")
    const adminTagRol = document.getElementById("adminTagRol")
    const configDirecta = document.getElementById("configDirecta")
    const configSolicitud = document.getElementById("configSolicitud")
    const navAdminGroup = document.getElementById("navAdminGroup")
    
    if (adminAvatar) {
        adminAvatar.textContent = usuario.nombre.charAt(0).toUpperCase()
    }
    
    if (adminRol) {
        adminRol.textContent = esSuperAdmin ? "Super Admin" : "Administrador"
    }
    
    if (adminNombre) {
        adminNombre.textContent = "Admin " + usuario.nombre
    }
    
    if (adminTagRol) {
        adminTagRol.textContent = esSuperAdmin ? "SUPER ADMIN" : "ADMIN"
    }
    
    if (esSuperAdmin) {
        if (configDirecta) configDirecta.style.display = "block"
        if (navAdminGroup) navAdminGroup.style.display = "block"
    } else {
        if (configSolicitud) configSolicitud.style.display = "block"
        if (navAdminGroup) navAdminGroup.style.display = "none"
    }
    
    // Actualizar avatar pequeño si existe
    const adminAvatarSmall = document.getElementById("adminAvatarSmall")
    const adminNombreSmall = document.getElementById("adminNombreSmall")
    
    if (adminAvatarSmall) {
        adminAvatarSmall.textContent = usuario.nombre.charAt(0).toUpperCase()
    }
    
    if (adminNombreSmall) {
        adminNombreSmall.textContent = usuario.nombre || 'Admin'
    }
})

// Botón cerrar sesión
document.getElementById("btnCerrarSesion").addEventListener("click", function() {
    localStorage.removeItem("admin-token")
    localStorage.removeItem("admin-usuario")
    window.location.href = "admin-login.html"
})

// ============================================
// FUNCIONES ORIGINALES
// ============================================

async function cambiarDatoDirecto(campo, inputId) {
    const input = document.getElementById(inputId)
    if (!input) return
    
    const valor = input.value.trim()
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
        input.value = ""
    } else {
        mostrarToast(datos.error, true)
    }
}

function mostrarSeccion(nombre, event) {
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activo"))
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("activo"))
    
    const seccion = document.getElementById("seccion-" + nombre)
    if (seccion) seccion.classList.add("activo")

    const titulos = {
        dashboard: "Dashboard", 
        ventas: "Ventas", 
        productos: "Productos",
        pedidos: "Pedidos", 
        resenas: "Reseñas", 
        usuarios: "Usuarios",
        invitaciones: "Invitaciones", 
        configuracion: "Configuración", 
        novedades: "Novedades"
    }

    const tituloSeccion = document.getElementById("tituloSeccion")
    const breadcrumbActual = document.getElementById("breadcrumbActual")
    
    if (tituloSeccion) tituloSeccion.textContent = titulos[nombre] || nombre
    if (breadcrumbActual) breadcrumbActual.textContent = titulos[nombre] || nombre

    if (event && event.target) event.target.classList.add("activo")

    if (nombre === "dashboard") cargarDashboardReal()
    if (nombre === "productos") cargarProductos()
    if (nombre === "pedidos") cargarPedidos()
    if (nombre === "usuarios") cargarUsuarios()
    if (nombre === "ventas") cargarVentas()
    if (nombre === "resenas") cargarResenas()
    if (nombre === "invitaciones") cargarSolicitudes()
    if (nombre === "novedades") cargarHistorialNovedades()
}

async function solicitarCambio(campo, inputId) {
    const input = document.getElementById(inputId)
    if (!input) return
    
    const valor_nuevo = input.value.trim()
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
        input.value = ""
    } else {
        mostrarToast(datos.error, true)
    }
}

async function cargarEstadisticas() {
    const r = await fetch(API + "/estadisticas", {
        headers: { "authorization": token }
    })
    const stats = await r.json()
    
    document.getElementById("statProductos").textContent = stats.productos || 0
    document.getElementById("statPedidos").textContent = stats.pedidos || 0
    document.getElementById("statUsuarios").textContent = stats.usuarios || 0
    document.getElementById("statVentas").textContent = "$" + Number(stats.ventas || 0).toLocaleString()
    
    cargarPedidosRecientes()
}

async function cargarPedidosRecientes() {
    const r = await fetch(API + "/pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await r.json()
    const tbody = document.getElementById("tbodyPedidosRecientes")
    if (!tbody) return
    
    const recientes = pedidos.slice(0, 5)

    tbody.innerHTML = recientes.map(function(p) {
        return `
            <tr>
                <td>#${p.id}</td>
                <td>${p.usuario || "Cliente"}</td>
                <td>$${Number(p.total || 0).toLocaleString()}</td>
                <td><span class="badge badge-${p.estado || 'pendiente'}">${p.estado || 'pendiente'}</span></td>
                <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
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

    const total = pedidos.reduce((sum, p) => sum + Number(p.total || 0), 0)
    const promedio = pedidos.length ? total / pedidos.length : 0
    const entregados = pedidos.filter(p => p.estado === "entregado").length
    const pendientes = pedidos.filter(p => p.estado === "pendiente").length

    document.getElementById("ventaTotal").textContent = "$" + total.toLocaleString()
    document.getElementById("ventaPromedio").textContent = "$" + Math.round(promedio).toLocaleString()
    document.getElementById("ventaEntregados").textContent = entregados
    document.getElementById("ventaPendientes").textContent = pendientes

    const tbody = document.getElementById("tbodyVentas")
    if (!tbody) return
    
    tbody.innerHTML = pedidos.map(function(p) {
        return `
            <tr>
                <td>#${p.id}</td>
                <td>${p.usuario || "Cliente"}</td>
                <td>$${Number(p.total || 0).toLocaleString()}</td>
                <td><span class="badge badge-${p.estado || 'pendiente'}">${p.estado || 'pendiente'}</span></td>
                <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
            </tr>
        `
    }).join("")
}

async function cargarProductos() {
    const r = await fetch(API + "/productos", {
        headers: { "authorization": token }
    })
    const productos = await r.json()
    const tbody = document.getElementById("tbodyProductos")
    if (!tbody) return
    
    tbody.innerHTML = ""

    productos.forEach(function(p) {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${p.imagen ? `<img src="${API}${p.imagen}">` : "📦"}</td>
            <td>${p.nombre || ''}</td>
            <td>$${Number(p.precio || 0).toLocaleString()}</td>
            <td>${p.stock || 0}</td>
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
    const vistaTabla = document.getElementById("vistaTabla")
    const vistaFormulario = document.getElementById("vistaFormulario")
    const formTitulo = document.getElementById("formTitulo")
    const productoId = document.getElementById("productoId")
    const pNombre = document.getElementById("pNombre")
    const pPrecio = document.getElementById("pPrecio")
    const pStock = document.getElementById("pStock")
    const pCategoria = document.getElementById("pCategoria")
    const pDescripcion = document.getElementById("pDescripcion")
    
    if (vistaTabla) vistaTabla.style.display = "none"
    if (vistaFormulario) vistaFormulario.style.display = "block"
    if (formTitulo) formTitulo.textContent = "Agregar producto"
    if (productoId) productoId.value = ""
    if (pNombre) pNombre.value = ""
    if (pPrecio) pPrecio.value = ""
    if (pStock) pStock.value = ""
    if (pCategoria) pCategoria.value = ""
    if (pDescripcion) pDescripcion.value = ""
}

function cancelarFormProducto() {
    const vistaTabla = document.getElementById("vistaTabla")
    const vistaFormulario = document.getElementById("vistaFormulario")
    
    if (vistaTabla) vistaTabla.style.display = "block"
    if (vistaFormulario) vistaFormulario.style.display = "none"
}

async function editarProducto(id) {
    const r = await fetch(API + "/productos/" + id, {
        headers: { "authorization": token }
    })
    const p = await r.json()
    
    const vistaTabla = document.getElementById("vistaTabla")
    const vistaFormulario = document.getElementById("vistaFormulario")
    const formTitulo = document.getElementById("formTitulo")
    const productoId = document.getElementById("productoId")
    const pNombre = document.getElementById("pNombre")
    const pPrecio = document.getElementById("pPrecio")
    const pStock = document.getElementById("pStock")
    const pCategoria = document.getElementById("pCategoria")
    const pDescripcion = document.getElementById("pDescripcion")
    
    if (vistaTabla) vistaTabla.style.display = "none"
    if (vistaFormulario) vistaFormulario.style.display = "block"
    if (formTitulo) formTitulo.textContent = "Editar producto"
    if (productoId) productoId.value = p.id
    if (pNombre) pNombre.value = p.nombre || ""
    if (pPrecio) pPrecio.value = p.precio || ""
    if (pStock) pStock.value = p.stock || ""
    if (pCategoria) pCategoria.value = p.categoria || ""
    if (pDescripcion) pDescripcion.value = p.descripcion || ""
}

async function guardarProducto() {
    const id = document.getElementById("productoId")?.value
    const pNombre = document.getElementById("pNombre")?.value
    const pPrecio = document.getElementById("pPrecio")?.value
    const pStock = document.getElementById("pStock")?.value
    const pCategoria = document.getElementById("pCategoria")?.value
    const pDescripcion = document.getElementById("pDescripcion")?.value
    const pImagen = document.getElementById("pImagen")?.files[0]
    
    const formData = new FormData()
    formData.append("nombre", pNombre || "")
    formData.append("precio", pPrecio || 0)
    formData.append("stock", pStock || 0)
    formData.append("categoria", pCategoria || "")
    formData.append("descripcion", pDescripcion || "")

    if (pImagen) formData.append("imagen", pImagen)

    const metodo = id ? "PUT" : "POST"
    const url = id ? API + "/productos/" + id : API + "/productos"

    const r = await fetch(url, {
        method: metodo,
        headers: { "authorization": token },
        body: formData
    })

    if (r.ok) {
        cancelarFormProducto()
        await cargarProductos()
        mostrarToast("✓ Producto guardado correctamente")
    }
}

async function eliminarProducto(id) {
    if (!confirm("¿Seguro que desea eliminar este producto?")) return
    await fetch(API + "/productos/" + id, {
        method: "DELETE",
        headers: { "authorization": token }
    })
    await cargarProductos()
    mostrarToast("✓ Producto eliminado")
}

async function cargarPedidos() {
    const r = await fetch(API + "/pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await r.json()
    const tbody = document.getElementById("tbodyPedidos")
    if (!tbody) return
    
    tbody.innerHTML = ""

    pedidos.forEach(function(p) {
        const direccionCompleta = p.tipo_envio === "nacional"
            ? `${p.direccion || ''}, ${p.barrio || ''}, ${p.ciudad || ''}, ${p.departamento || ''}`
            : `${p.direccion || ''}, ${p.barrio || ''}`

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>#${p.id}</td>
            <td>
                <div>${p.usuario || ''}</div>
                <div style="font-size:0.75rem;color:#888">${p.email_usuario || ''}</div>
            </td>
            <td>$${Number(p.total || 0).toLocaleString()}</td>
            <td><span class="badge badge-${p.estado || 'pendiente'}">${p.estado || 'pendiente'}</span></td>
            <td>
                <div style="font-size:0.8rem">
                    <div><b>${p.destinatario || '-'}</b> · CC: ${p.cedula || '-'}</div>
                    <div>📞 ${p.telefono || '-'}</div>
                    <div>📍 ${p.direccion ? direccionCompleta : 'Sin dirección'}</div>
                    ${p.indicaciones ? `<div style="color:#888">💬 ${p.indicaciones}</div>` : ''}
                </div>
            </td>
            <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
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
    if (!tbody) return

    if (!resenas || !resenas.length) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;color:#888'>No hay reseñas</td></tr>"
        return
    }

    tbody.innerHTML = resenas.map(function(r) {
        const estrellas = "★".repeat(r.calificacion || 0) + "☆".repeat(5 - (r.calificacion || 0))

        return `
            <tr>
                <td>${r.producto || ''}</td>
                <td>${r.usuario || ''}</td>
                <td style="color:#f59e0b">${estrellas} (${r.likes || 0} 👍)</td>
                <td>${r.comentario || ''}</td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                <td style="display:flex; gap:0.5rem; flex-wrap:wrap">
                    <button class="btn-edit" onclick="toggleLikeAdmin(${r.id}, this)">👍 Like</button>
                    <button class="btn-edit" onclick="toggleRespuestaAdmin(${r.id})">💬 Responder</button>
                    <button class="btn-delete" onclick="eliminarResena(${r.id})">Eliminar</button>
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
        if (btn) btn.style.color = datos.liked ? "#2563eb" : ""
        mostrarToast(datos.liked ? "👍 Like agregado" : "Like quitado")
    }
}

function toggleRespuestaAdmin(resenaId) {
    const form = document.getElementById("form-admin-respuesta-" + resenaId)
    if (form) {
        form.style.display = form.style.display === "none" ? "table-row" : "none"
    }
}

async function enviarRespuestaAdmin(resenaId) {
    const input = document.getElementById("input-admin-respuesta-" + resenaId)
    if (!input) return
    
    const comentario = input.value.trim()
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
        input.value = ""
        const form = document.getElementById("form-admin-respuesta-" + resenaId)
        if (form) form.style.display = "none"
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
        await cargarResenas()
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

async function cargarUsuarios() {
    const r = await fetch(API + "/usuarios", {
        headers: { "authorization": token }
    })
    const usuarios = await r.json()
    const tbody = document.getElementById("tbodyUsuarios")
    if (!tbody) return
    
    tbody.innerHTML = ""

    usuarios.forEach(function(u) {
        const tr = document.createElement("tr")
        const esMiCuenta = u.id === usuario.id
        const esSuperAdminUsuario = u.rol === "superadmin"

        tr.innerHTML = `
            <td>${u.nombre || ''}</td>
            <td>${u.email || ''}</td>
            <td><span class="badge badge-${u.rol || 'usuario'}">${u.rol || 'usuario'}</span></td>
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
    await cargarUsuarios()
    mostrarToast("✓ Rol actualizado")
}

async function generarInvitacion() {
    const emailInput = document.getElementById("emailInvitacion")
    if (!emailInput) return
    
    const email = emailInput.value.trim()
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
        const linkGenerado = document.getElementById("linkGenerado")
        const linkInvitacion = document.getElementById("linkInvitacion")
        
        if (linkGenerado) linkGenerado.style.display = "block"
        if (linkInvitacion) linkInvitacion.value = datos.link || ""
        
        mostrarToast("✓ Link generado correctamente")
    } else {
        mostrarToast(datos.error || "Error al generar link", true)
    }
}

function copiarLink() {
    const link = document.getElementById("linkInvitacion")
    if (!link) return
    
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
    if (!tbody) return

    if (!solicitudes || !solicitudes.length) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;color:#888'>No hay solicitudes pendientes</td></tr>"
        return
    }

    tbody.innerHTML = solicitudes.map(function(s) {
        const valor = s.campo === "password" ? "••••••••" : (s.valor_nuevo || '')
        return `
            <tr>
                <td>${s.nombre || ''}</td>
                <td>${s.email || ''}</td>
                <td>${s.campo || ''}</td>
                <td>${valor}</td>
                <td>${s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</td>
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
        await cargarSolicitudes()
    }
}

function mostrarToast(mensaje, esError = false) {
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
    
    toast.style.background = esError ? '#ef4444' : '#22c55e'
    toast.textContent = mensaje
    toast.style.opacity = "1"
    toast.style.transform = "translateY(0)"
    
    setTimeout(function() {
        toast.style.opacity = "0"
        toast.style.transform = "translateY(20px)"
    }, 3000)
}

// ============================================
// FUNCIONES NUEVAS PARA DASHBOARD REAL
// ============================================

async function cargarDashboardReal() {
    try {
        await cargarEstadisticas()
        await actualizarEstadisticasTiempoReal()
    } catch (error) {
        console.error("Error cargando dashboard:", error)
    }
}

async function actualizarEstadisticasTiempoReal() {
    try {
        const [productos, pedidos, resenas] = await Promise.all([
            fetch(API + "/productos", { headers: { "authorization": token } }).then(r => r.json()).catch(() => []),
            fetch(API + "/pedidos", { headers: { "authorization": token } }).then(r => r.json()).catch(() => []),
            fetch(API + "/resenas", { headers: { "authorization": token } }).then(r => r.json()).catch(() => [])
        ])
        
        // Actualizar pendientes
        const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
        const pedidosPendientesEl = document.getElementById("pedidosPendientes")
        if (pedidosPendientesEl) pedidosPendientesEl.textContent = pendientes + ' pendientes'
        
        // Actualizar banner
        document.getElementById("bannerProductos").textContent = productos.length || 0
        document.getElementById("bannerPedidos").textContent = pedidos.length || 0
        
        // Top productos
        await actualizarTopProductos(productos, pedidos)
        
        // Novedades recientes
        actualizarNovedadesRecientes(pedidos, resenas, productos)
        
        // Eventos próximos
        actualizarEventosProximos(pedidos, productos)
        
        console.log("✅ Estadísticas actualizadas")
        
    } catch (error) {
        console.error("Error en actualización:", error)
    }
}

async function actualizarTopProductos(productos, pedidos) {
    const ventasPorProducto = {}
    
    for (const pedido of pedidos) {
        try {
            const items = await fetch(API + `/pedidos/${pedido.id}/items`, {
                headers: { "authorization": token }
            }).then(r => r.json()).catch(() => [])
            
            items.forEach(item => {
                if (!ventasPorProducto[item.producto_id]) {
                    ventasPorProducto[item.producto_id] = {
                        nombre: item.nombre,
                        cantidad: 0,
                        total: 0,
                        id: item.producto_id
                    }
                }
                ventasPorProducto[item.producto_id].cantidad += item.cantidad || 0
                ventasPorProducto[item.producto_id].total += (item.precio || 0) * (item.cantidad || 0)
            })
        } catch (e) {}
    }
    
    const topProductos = Object.values(ventasPorProducto)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)
    
    const container = document.getElementById("topProductosContainer")
    if (!container) return
    
    if (topProductos.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center;">No hay ventas aún</div>'
    } else {
        const colores = ['#2560a8', '#1e7d4e', '#b8922a', '#7d3c98', '#c0392b']
        container.innerHTML = topProductos.map((p, i) => `
            <div class="materia-item" onclick="editarProducto(${p.id})">
                <div class="materia-color" style="background:${colores[i]}"></div>
                <div class="materia-info">
                    <div class="materia-name">${p.nombre}</div>
                    <div class="materia-prof">${p.cantidad} vendidos</div>
                </div>
                <div class="materia-right">
                    <div class="materia-pct">$${p.total.toLocaleString()}</div>
                </div>
            </div>
        `).join('')
    }
}

function actualizarNovedadesRecientes(pedidos, resenas, productos) {
    const container = document.querySelector('.novedades-items')
    if (!container) return
    
    const novedades = []
    
    // Pedidos recientes (últimas 24h)
    const hace24h = new Date(Date.now() - 24*60*60*1000)
    pedidos
        .filter(p => p.created_at && new Date(p.created_at) > hace24h)
        .slice(0, 3)
        .forEach(p => {
            novedades.push(`
                <div class="novedad-item" onclick="mostrarSeccion('pedidos')">
                    <div class="nov-dot nov-blue"></div>
                    <div class="nov-info">
                        <div class="nov-text"><strong>Nuevo pedido #${p.id}:</strong> $${Number(p.total || 0).toLocaleString()}</div>
                        <div class="nov-time">${calcularTiempoRelativo(new Date(p.created_at))}</div>
                    </div>
                </div>
            `)
        })
    
    // Reseñas recientes
    resenas.slice(0, 2).forEach(r => {
        novedades.push(`
            <div class="novedad-item" onclick="mostrarSeccion('resenas')">
                <div class="nov-dot nov-gold"></div>
                <div class="nov-info">
                    <div class="nov-text"><strong>Nueva reseña:</strong> ${r.calificacion || 0} ★</div>
                    <div class="nov-time">Recientemente</div>
                </div>
            </div>
        `)
    })
    
    // Stock bajo
    productos.filter(p => p.stock < 10).slice(0, 2).forEach(p => {
        novedades.push(`
            <div class="novedad-item" onclick="mostrarSeccion('productos')">
                <div class="nov-dot nov-red"></div>
                <div class="nov-info">
                    <div class="nov-text"><strong>Stock bajo:</strong> ${p.nombre} (${p.stock} uds)</div>
                    <div class="nov-time">¡Reabastecer pronto!</div>
                </div>
            </div>
        `)
    })
    
    container.innerHTML = novedades.join('') || '<div class="novedad-item">No hay novedades</div>'
}

function actualizarEventosProximos(pedidos, productos) {
    const container = document.querySelector('.agenda-items')
    if (!container) return
    
    const eventos = []
    
    // Eventos de entrega (pedidos pendientes)
    pedidos
        .filter(p => p.estado === 'pendiente' || p.estado === 'procesando')
        .slice(0, 3)
        .forEach(p => {
            const fecha = p.created_at ? new Date(p.created_at) : new Date()
            fecha.setDate(fecha.getDate() + 3)
            
            eventos.push(`
                <div class="agenda-item" onclick="mostrarSeccion('pedidos')">
                    <div class="agenda-date">
                        <div class="agenda-day">${fecha.getDate()}</div>
                        <div class="agenda-mon">${fecha.toLocaleString('es', { month: 'short' }).toUpperCase()}</div>
                    </div>
                    <div class="agenda-info">
                        <div class="agenda-event">Entrega pedido #${p.id}</div>
                        <div class="agenda-meta">
                            <span class="agenda-type type-class">Entrega</span>
                            $${Number(p.total || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            `)
        })
    
    container.innerHTML = eventos.join('') || '<div class="agenda-item">No hay eventos</div>'
}

function calcularTiempoRelativo(fecha) {
    const ahora = new Date()
    const diffMs = ahora - fecha
    const diffMin = Math.round(diffMs / (1000 * 60))
    const diffHoras = Math.round(diffMs / (1000 * 60 * 60))
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMin < 1) return 'Ahora mismo'
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    if (diffDias < 7) return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`
    return fecha.toLocaleDateString('es-CO')
}

async function cargarHistorialNovedades() {
    // Implementación simple
    const container = document.getElementById("historialNovedades")
    if (container) {
        container.innerHTML = '<div style="padding:20px; text-align:center;">Historial de novedades</div>'
    }
}

function filtrarNovedades() {
    // Implementación básica
}

function cargarPaginaNovedades(direccion) {
    // Implementación básica
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById("seccion-dashboard")?.classList.contains("activo")) {
        cargarDashboardReal()
    }
})

// Actualizar cada 5 minutos
setInterval(actualizarEstadisticasTiempoReal, 5 * 60 * 1000)

// Sobrescribir funciones originales
window.cargarEstadisticas = cargarDashboardReal