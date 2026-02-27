console.log("admin.js cargando...")
console.log("token:", localStorage.getItem("admin-token"))
console.log("usuario:", localStorage.getItem("admin-usuario"))

// ============================================
// CONFIGURACIÓN
// ============================================
const API = "https://mi-servidor-2mff.onrender.com" // Verifica que esta URL sea correcta

const token = localStorage.getItem("admin-token")
const usuario = JSON.parse(localStorage.getItem("admin-usuario"))

if (!token || !usuario || (usuario.rol !== "admin" && usuario.rol !== "superadmin")) {
    window.location.href = "admin-login.html"
}

const esSuperAdmin = usuario.rol === "superadmin"
let intervaloCarga = null

// ============================================
// INICIALIZACIÓN (solo cuando el DOM está listo)
// ============================================
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM cargado, inicializando panel...")
    
    // Inicializar avatar y rol
    const adminAvatar = document.getElementById("adminAvatar")
    const adminRol = document.getElementById("adminRol")
    const adminNombre = document.getElementById("adminNombre")
    const adminTagRol = document.getElementById("adminTagRol")
    const configDirecta = document.getElementById("configDirecta")
    const configSolicitud = document.getElementById("configSolicitud")
    const navAdminGroup = document.getElementById("navAdminGroup")
    
    if (adminAvatar) adminAvatar.textContent = usuario.nombre.charAt(0).toUpperCase()
    if (adminRol) adminRol.textContent = esSuperAdmin ? "Super Admin" : "Administrador"
    if (adminNombre) adminNombre.textContent = "Admin " + usuario.nombre
    if (adminTagRol) adminTagRol.textContent = esSuperAdmin ? "SUPER ADMIN" : "ADMIN"
    
    if (esSuperAdmin) {
        if (configDirecta) configDirecta.style.display = "block"
        if (navAdminGroup) navAdminGroup.style.display = "block"
    } else {
        if (configSolicitud) configSolicitud.style.display = "block"
        if (navAdminGroup) navAdminGroup.style.display = "none"
    }
    
    // Cargar datos iniciales solo si estamos en dashboard
    if (document.getElementById("seccion-dashboard")?.classList.contains("activo")) {
        console.log("Dashboard activo, cargando datos...")
        cargarDashboardReal()
    }
    
    // Limpiar intervalo anterior si existe
    if (intervaloCarga) clearInterval(intervaloCarga)
    
    // Configurar actualización cada 30 segundos (NO cada 5 minutos)
    intervaloCarga = setInterval(function() {
        if (document.getElementById("seccion-dashboard")?.classList.contains("activo")) {
            console.log("Actualizando dashboard...")
            cargarDashboardReal()
        }
    }, 30000) // 30 segundos es más razonable
})

// Botón cerrar sesión
document.getElementById("btnCerrarSesion")?.addEventListener("click", function() {
    localStorage.removeItem("admin-token")
    localStorage.removeItem("admin-usuario")
    window.location.href = "admin-login.html"
})

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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

function esArray(dato) {
    return Array.isArray(dato)
}

// ============================================
// FUNCIONES DE NAVEGACIÓN
// ============================================

function mostrarSeccion(nombre, event) {
    console.log("Cambiando a sección:", nombre)
    
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

    // Cargar datos según la sección (UNA SOLA VEZ)
    if (nombre === "dashboard") {
        cargarDashboardReal()
    } else if (nombre === "productos") {
        cargarProductos()
    } else if (nombre === "pedidos") {
        cargarPedidos()
    } else if (nombre === "usuarios") {
        cargarUsuarios()
    } else if (nombre === "ventas") {
        cargarVentas()
    } else if (nombre === "resenas") {
        cargarResenas()
    } else if (nombre === "invitaciones") {
        cargarSolicitudes()
    } else if (nombre === "novedades") {
        cargarHistorialNovedades()
    }
}

// ============================================
// FUNCIONES ORIGINALES (mantenidas igual)
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

async function cargarPedidosRecientes() {
    try {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        const tbody = document.getElementById("tbodyPedidosRecientes")
        if (!tbody || !esArray(pedidos)) return
        
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
    } catch (error) {
        console.error("Error cargando pedidos recientes:", error)
    }
}

let ultimaRevision = new Date().toISOString()

async function verificarCancelaciones() {
    try {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        if (!esArray(pedidos)) return
        
        const cancelados = pedidos.filter(p => 
            p.estado === "cancelado" && 
            new Date(p.created_at) > new Date(ultimaRevision)
        )

        cancelados.forEach(function(p) {
            mostrarToast(`❌ Pedido #${p.id} de ${p.usuario} fue cancelado`, true)
        })

        if (cancelados.length) ultimaRevision = new Date().toISOString()
    } catch (error) {
        console.error("Error verificando cancelaciones:", error)
    }
}

// Iniciar verificación de cancelaciones (solo una vez)
setInterval(verificarCancelaciones, 30000)

async function cargarVentas() {
    try {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        if (!esArray(pedidos)) return

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
    } catch (error) {
        console.error("Error cargando ventas:", error)
    }
}

async function cargarProductos() {
    try {
        const r = await fetch(API + "/productos", {
            headers: { "authorization": token }
        })
        const productos = await r.json()
        const tbody = document.getElementById("tbodyProductos")
        if (!tbody || !esArray(productos)) return
        
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
    } catch (error) {
        console.error("Error cargando productos:", error)
    }
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
    try {
        const r = await fetch(API + "/productos/" + id, {
            headers: { "authorization": token }
        })
        const p = await r.json()
        
        document.getElementById("vistaTabla").style.display = "none"
        document.getElementById("vistaFormulario").style.display = "block"
        document.getElementById("formTitulo").textContent = "Editar producto"
        document.getElementById("productoId").value = p.id
        document.getElementById("pNombre").value = p.nombre || ""
        document.getElementById("pPrecio").value = p.precio || ""
        document.getElementById("pStock").value = p.stock || ""
        document.getElementById("pCategoria").value = p.categoria || ""
        document.getElementById("pDescripcion").value = p.descripcion || ""
    } catch (error) {
        console.error("Error editando producto:", error)
    }
}

async function guardarProducto() {
    const id = document.getElementById("productoId")?.value
    const formData = new FormData()
    formData.append("nombre", document.getElementById("pNombre")?.value || "")
    formData.append("precio", document.getElementById("pPrecio")?.value || 0)
    formData.append("stock", document.getElementById("pStock")?.value || 0)
    formData.append("categoria", document.getElementById("pCategoria")?.value || "")
    formData.append("descripcion", document.getElementById("pDescripcion")?.value || "")

    const imagen = document.getElementById("pImagen")?.files[0]
    if (imagen) formData.append("imagen", imagen)

    const metodo = id ? "PUT" : "POST"
    const url = id ? API + "/productos/" + id : API + "/productos"

    try {
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
    } catch (error) {
        console.error("Error guardando producto:", error)
        mostrarToast("Error al guardar producto", true)
    }
}

async function eliminarProducto(id) {
    if (!confirm("¿Seguro que desea eliminar este producto?")) return
    try {
        await fetch(API + "/productos/" + id, {
            method: "DELETE",
            headers: { "authorization": token }
        })
        await cargarProductos()
        mostrarToast("✓ Producto eliminado")
    } catch (error) {
        console.error("Error eliminando producto:", error)
        mostrarToast("Error al eliminar producto", true)
    }
}

async function cargarPedidos() {
    try {
        const r = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await r.json()
        const tbody = document.getElementById("tbodyPedidos")
        if (!tbody || !esArray(pedidos)) return
        
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
    } catch (error) {
        console.error("Error cargando pedidos:", error)
    }
}

async function cargarResenas() {
    try {
        const r = await fetch(API + "/resenas", {
            headers: { "authorization": token }
        })
        const resenas = await r.json()
        const tbody = document.getElementById("tbodyResenas")
        if (!tbody) return

        if (!esArray(resenas) || resenas.length === 0) {
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
    } catch (error) {
        console.error("Error cargando reseñas:", error)
    }
}

async function toggleLikeAdmin(resenaId, btn) {
    try {
        const respuesta = await fetch(API + "/resenas/" + resenaId + "/like", {
            method: "POST",
            headers: { "authorization": token }
        })
        const datos = await respuesta.json()
        if (respuesta.ok) {
            if (btn) btn.style.color = datos.liked ? "#2563eb" : ""
            mostrarToast(datos.liked ? "👍 Like agregado" : "Like quitado")
        }
    } catch (error) {
        console.error("Error toggling like:", error)
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

    try {
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
    } catch (error) {
        console.error("Error enviando respuesta:", error)
        mostrarToast("Error al enviar respuesta", true)
    }
}

async function eliminarResena(id) {
    if (!confirm("¿Eliminar esta reseña?")) return
    try {
        const r = await fetch(API + "/resenas/" + id, {
            method: "DELETE",
            headers: { "authorization": token }
        })
        if (r.ok) {
            mostrarToast("✓ Reseña eliminada")
            await cargarResenas()
        }
    } catch (error) {
        console.error("Error eliminando reseña:", error)
        mostrarToast("Error al eliminar reseña", true)
    }
}

async function cambiarEstadoPedido(id, estado) {
    try {
        await fetch(API + "/pedidos/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "authorization": token
            },
            body: JSON.stringify({ estado })
        })
        mostrarToast("✓ Estado actualizado")
    } catch (error) {
        console.error("Error cambiando estado:", error)
        mostrarToast("Error al cambiar estado", true)
    }
}

async function cargarUsuarios() {
    try {
        const r = await fetch(API + "/usuarios", {
            headers: { "authorization": token }
        })
        const usuarios = await r.json()
        const tbody = document.getElementById("tbodyUsuarios")
        if (!tbody || !esArray(usuarios)) return
        
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
    } catch (error) {
        console.error("Error cargando usuarios:", error)
    }
}

async function cambiarRol(id, rolActual) {
    const nuevoRol = rolActual === "admin" ? "usuario" : "admin"
    try {
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
    } catch (error) {
        console.error("Error cambiando rol:", error)
        mostrarToast("Error al cambiar rol", true)
    }
}

async function generarInvitacion() {
    const emailInput = document.getElementById("emailInvitacion")
    if (!emailInput) return
    
    const email = emailInput.value.trim()
    if (!email) {
        mostrarToast("Escribe un email", true)
        return
    }

    try {
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
    } catch (error) {
        console.error("Error generando invitación:", error)
        mostrarToast("Error al generar invitación", true)
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
    try {
        const respuesta = await fetch(API + "/solicitudes-cambio", {
            headers: { "authorization": token }
        })
        const solicitudes = await respuesta.json()
        const tbody = document.getElementById("tbodySolicitudes")
        if (!tbody) return

        if (!esArray(solicitudes) || solicitudes.length === 0) {
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
    } catch (error) {
        console.error("Error cargando solicitudes:", error)
    }
}

async function responderSolicitud(id, estado) {
    try {
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
    } catch (error) {
        console.error("Error respondiendo solicitud:", error)
        mostrarToast("Error al responder solicitud", true)
    }
}

// ============================================
// FUNCIONES MEJORADAS PARA DASHBOARD (SIN BUCLES)
// ============================================

// Variable para evitar múltiples cargas simultáneas
let cargandoDashboard = false

async function cargarDashboardReal() {
    // Evitar múltiples llamadas simultáneas
    if (cargandoDashboard) {
        console.log("Ya hay una carga en curso, ignorando...")
        return
    }
    
    cargandoDashboard = true
    
    try {
        console.log("Cargando datos del dashboard...")
        
        // Cargar estadísticas básicas (esto no se llama a sí mismo)
        await cargarEstadisticasBasicas()
        
        // Cargar datos adicionales para el dashboard
        await cargarDatosDashboard()
        
        console.log("✅ Dashboard actualizado correctamente")
    } catch (error) {
        console.error("Error cargando dashboard:", error)
    } finally {
        cargandoDashboard = false
    }
}

async function cargarEstadisticasBasicas() {
    try {
        const r = await fetch(API + "/estadisticas", {
            headers: { "authorization": token }
        })
        const stats = await r.json()
        
        const statProductos = document.getElementById("statProductos")
        const statPedidos = document.getElementById("statPedidos")
        const statUsuarios = document.getElementById("statUsuarios")
        const statVentas = document.getElementById("statVentas")
        
        if (statProductos) statProductos.textContent = stats.productos || 0
        if (statPedidos) statPedidos.textContent = stats.pedidos || 0
        if (statUsuarios) statUsuarios.textContent = stats.usuarios || 0
        if (statVentas) statVentas.textContent = "$" + Number(stats.ventas || 0).toLocaleString()
        
        // Banner stats
        const bannerProductos = document.getElementById("bannerProductos")
        const bannerPedidos = document.getElementById("bannerPedidos")
        const bannerUsuarios = document.getElementById("bannerUsuarios")
        
        if (bannerProductos) bannerProductos.textContent = stats.productos || 0
        if (bannerPedidos) bannerPedidos.textContent = stats.pedidos || 0
        if (bannerUsuarios) bannerUsuarios.textContent = stats.usuarios || 0
        
    } catch (error) {
        console.error("Error cargando estadísticas básicas:", error)
    }
}

async function cargarDatosDashboard() {
    try {
        // Cargar pedidos recientes
        await cargarPedidosRecientes()
        
        // Cargar productos y calcular top productos
        const productosRes = await fetch(API + "/productos", {
            headers: { "authorization": token }
        })
        const productos = await productosRes.json()
        
        // Cargar pedidos para cálculos adicionales
        const pedidosRes = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        })
        const pedidos = await pedidosRes.json()
        
        // Cargar reseñas para novedades
        const resenasRes = await fetch(API + "/resenas", {
            headers: { "authorization": token }
        })
        const resenas = await resenasRes.json()
        
        // Actualizar secciones del dashboard
        if (esArray(productos) && esArray(pedidos)) {
            actualizarTopProductos(productos, pedidos)
        }
        
        if (esArray(pedidos) && esArray(resenas) && esArray(productos)) {
            actualizarNovedadesRecientes(pedidos, resenas, productos)
            actualizarEventosProximos(pedidos, productos)
        }
        
        // Actualizar pedidos pendientes
        if (esArray(pedidos)) {
            const pendientes = pedidos.filter(p => p.estado === "pendiente").length
            const pedidosPendientesEl = document.getElementById("pedidosPendientes")
            if (pedidosPendientesEl) {
                pedidosPendientesEl.textContent = pendientes + " pendientes"
            }
        }
        
    } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
    }
}

function actualizarTopProductos(productos, pedidos) {
    const container = document.getElementById("topProductosContainer")
    if (!container) return
    
    // Simplemente mostrar los productos con stock (versión simplificada)
    const productosConStock = productos
        .filter(p => p.stock > 0)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
    
    if (productosConStock.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center;">No hay productos disponibles</div>'
        return
    }
    
    const colores = ['#2560a8', '#1e7d4e', '#b8922a', '#7d3c98', '#c0392b']
    
    container.innerHTML = productosConStock.map((p, i) => `
        <div class="materia-item" onclick="editarProducto(${p.id})">
            <div class="materia-color" style="background:${colores[i % colores.length]}"></div>
            <div class="materia-info">
                <div class="materia-name">${p.nombre}</div>
                <div class="materia-prof">Stock: ${p.stock} unidades</div>
            </div>
            <div class="materia-right">
                <div class="materia-progress-wrap">
                    <div class="materia-progress" style="width:${Math.min(100, p.stock)}%; background:${colores[i % colores.length]};"></div>
                </div>
                <div class="materia-pct">$${Number(p.precio || 0).toLocaleString()}</div>
            </div>
        </div>
    `).join('')
}

function actualizarNovedadesRecientes(pedidos, resenas, productos) {
    const container = document.querySelector('.novedades-items')
    if (!container) return
    
    const novedades = []
    
    // Pedidos recientes
    if (esArray(pedidos)) {
        pedidos.slice(0, 3).forEach(p => {
            novedades.push(`
                <div class="novedad-item" onclick="mostrarSeccion('pedidos')">
                    <div class="nov-dot nov-blue"></div>
                    <div class="nov-info">
                        <div class="nov-text"><strong>Pedido #${p.id}:</strong> $${Number(p.total || 0).toLocaleString()}</div>
                        <div class="nov-time">${p.estado || 'pendiente'}</div>
                    </div>
                </div>
            `)
        })
    }
    
    // Reseñas recientes
    if (esArray(resenas)) {
        resenas.slice(0, 2).forEach(r => {
            novedades.push(`
                <div class="novedad-item" onclick="mostrarSeccion('resenas')">
                    <div class="nov-dot nov-gold"></div>
                    <div class="nov-info">
                        <div class="nov-text"><strong>Reseña:</strong> ${r.calificacion || 0} ★</div>
                        <div class="nov-time">Recientemente</div>
                    </div>
                </div>
            `)
        })
    }
    
    // Stock bajo
    if (esArray(productos)) {
        productos.filter(p => p.stock < 10).slice(0, 2).forEach(p => {
            novedades.push(`
                <div class="novedad-item" onclick="mostrarSeccion('productos')">
                    <div class="nov-dot nov-red"></div>
                    <div class="nov-info">
                        <div class="nov-text"><strong>Stock bajo:</strong> ${p.nombre} (${p.stock} uds)</div>
                        <div class="nov-time">Reabastecer</div>
                    </div>
                </div>
            `)
        })
    }
    
    container.innerHTML = novedades.join('') || '<div class="novedad-item">No hay novedades</div>'
}

function actualizarEventosProximos(pedidos, productos) {
    const container = document.querySelector('.agenda-items')
    if (!container) return
    
    const eventos = []
    
    if (esArray(pedidos)) {
        pedidos.filter(p => p.estado === 'pendiente').slice(0, 3).forEach(p => {
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
    }
    
    container.innerHTML = eventos.join('') || '<div class="agenda-item">No hay eventos</div>'
}

async function cargarHistorialNovedades() {
    const container = document.getElementById("historialNovedades")
    if (container) {
        container.innerHTML = '<div style="padding:20px; text-align:center;">Historial de novedades (en desarrollo)</div>'
    }
}

function filtrarNovedades() {
    // Implementación básica
}

function cargarPaginaNovedades(direccion) {
    // Implementación básica
}

// Exponer funciones globalmente
window.mostrarSeccion = mostrarSeccion
window.cambiarDatoDirecto = cambiarDatoDirecto
window.solicitarCambio = solicitarCambio
window.mostrarFormProducto = mostrarFormProducto
window.cancelarFormProducto = cancelarFormProducto
window.editarProducto = editarProducto
window.guardarProducto = guardarProducto
window.eliminarProducto = eliminarProducto
window.cambiarEstadoPedido = cambiarEstadoPedido
window.toggleLikeAdmin = toggleLikeAdmin
window.toggleRespuestaAdmin = toggleRespuestaAdmin
window.enviarRespuestaAdmin = enviarRespuestaAdmin
window.eliminarResena = eliminarResena
window.cambiarRol = cambiarRol
window.generarInvitacion = generarInvitacion
window.copiarLink = copiarLink
window.responderSolicitud = responderSolicitud
window.filtrarNovedades = filtrarNovedades
window.cargarPaginaNovedades = cargarPaginaNovedades