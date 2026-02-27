
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

// ============================================
// FUNCIONES MEJORADAS PARA DASHBOARD REAL
// ============================================

// Cargar TODAS las métricas del dashboard desde la DB
async function cargarDashboardReal() {
    try {
        // Mostrar indicador de carga
        mostrarLoaderDashboard();
        
        // 1. Cargar estadísticas generales
        const statsRes = await fetch(API + "/estadisticas", {
            headers: { "authorization": token }
        });
        const stats = await statsRes.json();
        
        // 2. Cargar pedidos para métricas más detalladas
        const pedidosRes = await fetch(API + "/pedidos", {
            headers: { "authorization": token }
        });
        const pedidos = await pedidosRes.json();
        
        // 3. Cargar productos para top ventas
        const productosRes = await fetch(API + "/productos", {
            headers: { "authorization": token }
        });
        const productos = await productosRes.json();
        
        // 4. Cargar reseñas recientes
        const resenasRes = await fetch(API + "/resenas", {
            headers: { "authorization": token }
        });
        const resenas = await resenasRes.json();
        
        // 5. Cargar solicitudes pendientes (solo superadmin)
        if (usuario.rol === "superadmin") {
            const solicitudesRes = await fetch(API + "/solicitudes-cambio", {
                headers: { "authorization": token }
            });
            const solicitudes = await solicitudesRes.json();
            actualizarNovedadesSolicitudes(solicitudes);
        }
        
        // ACTUALIZAR TODAS LAS MÉTRICAS
        actualizarMetricasPrincipales(stats, pedidos);
        actualizarTopProductos(productos, pedidos);
        actualizarTablaPedidosRecientes(pedidos);
        actualizarProgresoMensual(pedidos, stats);
        actualizarEventosProximos(pedidos);
        actualizarNovedadesRecientes(pedidos, resenas, productos);
        actualizarBannerInfo(usuario, stats);
        
        // Ocultar loader
        ocultarLoaderDashboard();
        
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        mostrarToast("Error al cargar datos del dashboard", true);
    }
}

// ============================================
// ACTUALIZAR CADA SECCIÓN
// ============================================

function actualizarMetricasPrincipales(stats, pedidos) {
    // Stats cards principales
    document.getElementById("statProductos").textContent = stats.productos || 0;
    document.getElementById("statPedidos").textContent = stats.pedidos || 0;
    document.getElementById("statUsuarios").textContent = stats.usuarios || 0;
    
    // Formatear ventas
    const ventasFormateadas = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(stats.ventas || 0);
    document.getElementById("statVentas").textContent = ventasFormateadas;
    
    // Calcular pedidos pendientes
    const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
    const procesando = pedidos.filter(p => p.estado === "procesando").length;
    const entregados = pedidos.filter(p => p.estado === "entregado").length;
    
    // Actualizar badges y trends
    document.getElementById("pedidosPendientes").textContent = 
        `${pendientes} pendientes, ${procesando} en proceso`;
    
    // Calcular ventas del mes
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    const ventasMes = pedidos
        .filter(p => {
            const fechaPedido = new Date(p.created_at);
            return fechaPedido.getMonth() === mesActual && 
                   fechaPedido.getFullYear() === añoActual &&
                   p.estado === "entregado";
        })
        .reduce((sum, p) => sum + Number(p.total), 0);
    
    document.getElementById("ventasMes").textContent = 
        `+${Math.round((ventasMes / (stats.ventas || 1)) * 100)}% este mes`;
    
    // Banner stats
    document.getElementById("bannerProductos").textContent = stats.productos || 0;
    document.getElementById("bannerPedidos").textContent = stats.pedidos || 0;
    document.getElementById("bannerUsuarios").textContent = stats.usuarios || 0;
}

function actualizarTopProductos(productos, pedidos) {
    // Necesitamos obtener los items de cada pedido para saber qué productos se venden
    fetch(API + "/pedidos", { headers: { "authorization": token } })
        .then(r => r.json())
        .then(async pedidosCompletos => {
            // Crear mapa de ventas por producto
            const ventasPorProducto = {};
            
            // Para cada pedido, necesitamos sus items
            for (const pedido of pedidosCompletos) {
                const itemsRes = await fetch(API + `/pedidos/${pedido.id}/items`, {
                    headers: { "authorization": token }
                }).catch(() => ({ json: () => [] }));
                
                const items = await itemsRes.json().catch(() => []);
                
                items.forEach(item => {
                    if (!ventasPorProducto[item.producto_id]) {
                        ventasPorProducto[item.producto_id] = {
                            nombre: item.nombre,
                            cantidad: 0,
                            total: 0,
                            id: item.producto_id
                        };
                    }
                    ventasPorProducto[item.producto_id].cantidad += item.cantidad;
                    ventasPorProducto[item.producto_id].total += item.precio * item.cantidad;
                });
            }
            
            // Convertir a array y ordenar por cantidad vendida
            const topProductos = Object.values(ventasPorProducto)
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 5);
            
            // Si no hay ventas, mostrar productos con stock
            if (topProductos.length === 0) {
                const productosConStock = productos
                    .sort((a, b) => b.stock - a.stock)
                    .slice(0, 5)
                    .map(p => ({
                        nombre: p.nombre,
                        cantidad: 0,
                        total: 0,
                        id: p.id,
                        stock: p.stock,
                        precio: p.precio
                    }));
                
                renderTopProductos(productosConStock, true);
            } else {
                renderTopProductos(topProductos, false);
            }
        });
}

function renderTopProductos(productos, sinVentas = false) {
    const colores = ["#2560a8", "#1e7d4e", "#b8922a", "#7d3c98", "#c0392b"];
    const container = document.getElementById("topProductosContainer");
    
    if (!container) return;
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #7a7568;">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p style="margin-top: 16px;">No hay productos con ventas aún</p>
                <p style="font-size: 12px;">Los productos aparecerán aquí cuando tengan pedidos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productos.map((p, index) => {
        const progreso = sinVentas 
            ? Math.min(100, Math.round((p.stock / 100) * 100))
            : Math.min(100, Math.round((p.cantidad / 50) * 100)); // Escala relativa
        
        const totalFormateado = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(p.total || p.precio * (p.stock || 1));
        
        const badgeText = sinVentas 
            ? `Stock: ${p.stock}`
            : `${p.cantidad} vendidos`;
        
        const badgeClass = sinVentas ? 'badge-ok' : 'badge-pending';
        
        return `
            <div class="materia-item" onclick="editarProducto(${p.id})">
                <div class="materia-color" style="background:${colores[index % colores.length]};"></div>
                <div class="materia-info">
                    <div class="materia-name">${p.nombre}</div>
                    <div class="materia-prof">${badgeText}</div>
                </div>
                <div class="materia-right">
                    <div class="materia-progress-wrap">
                        <div class="materia-progress" style="width:${progreso}%; background:${colores[index % colores.length]};"></div>
                    </div>
                    <div class="materia-pct">${totalFormateado}</div>
                    <span class="materia-badge ${badgeClass}">${sinVentas ? 'En stock' : '+ventas'}</span>
                </div>
            </div>
        `;
    }).join("");
}

function actualizarTablaPedidosRecientes(pedidos) {
    const tbody = document.getElementById("tbodyPedidosRecientes");
    if (!tbody) return;
    
    const recientes = pedidos.slice(0, 5);
    
    if (recientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #7a7568;">
                    No hay pedidos recientes
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = recientes.map(p => {
        const fecha = new Date(p.created_at).toLocaleDateString('es-CO');
        const total = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(p.total);
        
        let badgeClass = 'badge-pendiente';
        if (p.estado === 'entregado') badgeClass = 'badge-entregado';
        if (p.estado === 'cancelado') badgeClass = 'badge-cancelado';
        if (p.estado === 'procesando') badgeClass = 'badge-procesando';
        if (p.estado === 'enviado') badgeClass = 'badge-enviado';
        
        return `
            <tr onclick="mostrarDetallePedido(${p.id})" style="cursor: pointer;">
                <td>#${p.id}</td>
                <td>${p.usuario || 'Cliente'}</td>
                <td>${total}</td>
                <td><span class="badge ${badgeClass}">${p.estado.toUpperCase()}</span></td>
                <td>${fecha}</td>
            </tr>
        `;
    }).join("");
}

function actualizarProgresoMensual(pedidos, stats) {
    // Calcular ventas del mes actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    const pedidosMes = pedidos.filter(p => {
        const fecha = new Date(p.created_at);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });
    
    const ventasMes = pedidosMes
        .filter(p => p.estado === "entregado")
        .reduce((sum, p) => sum + Number(p.total), 0);
    
    const pedidosCompletados = pedidosMes.filter(p => p.estado === "entregado").length;
    const totalPedidosMes = pedidosMes.length;
    
    // Meta mensual (podría venir de configuración o calcularse automáticamente)
    const metaMensual = stats.ventas ? Math.round(stats.ventas * 0.3) : 5000000; // 30% del total o 5M por defecto
    
    const progreso = Math.min(100, Math.round((ventasMes / metaMensual) * 100));
    
    // Actualizar anillo SVG
    const ring = document.querySelector('#progresoRing circle:last-child');
    if (ring) {
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (progreso / 100) * circumference;
        ring.style.strokeDasharray = `${circumference}`;
        ring.style.strokeDashoffset = offset;
    }
    
    // Actualizar textos
    document.querySelector('.ring-pct').textContent = progreso + '%';
    document.querySelectorAll('.legend-item .legend-val')[0].textContent = 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(ventasMes);
    document.querySelectorAll('.legend-item .legend-val')[1].textContent = 
        `${pedidosCompletados}/${totalPedidosMes}`;
    document.querySelectorAll('.legend-item .legend-val')[2].textContent = 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(metaMensual);
}

function actualizarEventosProximos(pedidos) {
    const container = document.querySelector('.card-elegant .agenda-items');
    if (!container) return;
    
    // Filtrar pedidos con fecha de entrega (asumiendo que tienen campo fecha_entrega)
    // Por ahora, usamos pedidos pendientes como "eventos"
    const eventos = pedidos
        .filter(p => p.estado === "pendiente" || p.estado === "procesando")
        .slice(0, 3)
        .map(p => {
            const fecha = new Date(p.created_at);
            fecha.setDate(fecha.getDate() + 3); // Entrega estimada en 3 días
            
            return {
                id: p.id,
                titulo: `Entrega pedido #${p.id}`,
                fecha: fecha,
                tipo: 'Entrega',
                cliente: p.usuario,
                total: p.total
            };
        });
    
    // También agregar eventos de stock bajo
    fetch(API + "/productos", { headers: { "authorization": token } })
        .then(r => r.json())
        .then(productos => {
            const stockBajo = productos
                .filter(p => p.stock < 10)
                .slice(0, 2)
                .map(p => ({
                    id: p.id,
                    titulo: `Stock bajo: ${p.nombre}`,
                    fecha: new Date(),
                    tipo: 'Alerta',
                    stock: p.stock
                }));
            
            const todosEventos = [...eventos, ...stockBajo].sort((a, b) => a.fecha - b.fecha);
            renderEventos(todosEventos);
        });
}

function renderEventos(eventos) {
    const container = document.querySelector('.agenda-items');
    if (!container) return;
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #7a7568;">
                No hay eventos próximos
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventos.map(e => {
        const fecha = e.fecha;
        const dia = fecha.getDate();
        const mes = fecha.toLocaleString('es-CO', { month: 'short' }).toUpperCase();
        
        let typeClass = 'type-task';
        if (e.tipo === 'Alerta') typeClass = 'type-exam';
        if (e.tipo === 'Entrega') typeClass = 'type-class';
        
        let descripcion = '';
        if (e.cliente) {
            descripcion = `${e.cliente} · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(e.total)}`;
        } else if (e.stock) {
            descripcion = `Quedan ${e.stock} unidades`;
        }
        
        return `
            <div class="agenda-item" onclick="verDetalleEvento('${e.tipo}', ${e.id})">
                <div class="agenda-date">
                    <div class="agenda-day">${dia}</div>
                    <div class="agenda-mon">${mes}</div>
                </div>
                <div class="agenda-info">
                    <div class="agenda-event">${e.titulo}</div>
                    <div class="agenda-meta">
                        <span class="agenda-type ${typeClass}">${e.tipo}</span>
                        ${descripcion}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function actualizarNovedadesRecientes(pedidos, resenas, productos) {
    const container = document.querySelector('.novedades-items');
    if (!container) return;
    
    const novedades = [];
    
    // 1. Nuevos pedidos (últimas 24 horas)
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nuevosPedidos = pedidos.filter(p => new Date(p.created_at) > hace24h);
    nuevosPedidos.forEach(p => {
        novedades.push({
            tipo: 'pedido',
            titulo: `Nuevo pedido #${p.id}`,
            descripcion: `${p.usuario || 'Cliente'} · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.total)}`,
            fecha: new Date(p.created_at),
            color: 'nov-blue',
            id: p.id
        });
    });
    
    // 2. Reseñas recientes
    resenas.forEach(r => {
        novedades.push({
            tipo: 'resena',
            titulo: `Nueva reseña: ${r.producto}`,
            descripcion: `${r.usuario} · ${'★'.repeat(r.calificacion)} (${r.likes} likes)`,
            fecha: new Date(r.created_at),
            color: 'nov-gold',
            id: r.id
        });
    });
    
    // 3. Stock bajo
    const stockBajo = productos.filter(p => p.stock < 5);
    stockBajo.forEach(p => {
        novedades.push({
            tipo: 'alerta',
            titulo: `Stock crítico: ${p.nombre}`,
            descripcion: `Quedan ${p.stock} unidades`,
            fecha: new Date(),
            color: 'nov-red',
            id: p.id
        });
    });
    
    // Ordenar por fecha (más reciente primero)
    novedades.sort((a, b) => b.fecha - a.fecha);
    
    // Mostrar las 5 más recientes
    const recientes = novedades.slice(0, 5);
    
    if (recientes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #7a7568;">
                No hay novedades recientes
            </div>
        `;
        return;
    }
    
    container.innerHTML = recientes.map(n => {
        const tiempo = calcularTiempoRelativo(n.fecha);
        
        return `
            <div class="novedad-item" onclick="verNovedad('${n.tipo}', ${n.id})">
                <div class="nov-dot ${n.color}"></div>
                <div class="nov-info">
                    <div class="nov-text"><strong>${n.titulo}:</strong> ${n.descripcion}</div>
                    <div class="nov-time">${tiempo}</div>
                </div>
            </div>
        `;
    }).join("");
}

function actualizarBannerInfo(usuario, stats) {
    document.getElementById("adminNombreBanner").textContent = usuario.nombre || 'Admin';
    document.getElementById("adminRolBanner").textContent = 
        usuario.rol === 'superadmin' ? 'Super Administrador · Panel de Control' : 'Administrador · Panel de Control';
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function calcularTiempoRelativo(fecha) {
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.round(diffMs / (1000 * 60));
    const diffHoras = Math.round(diffMs / (1000 * 60 * 60));
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    if (diffDias < 7) return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
    
    return fecha.toLocaleDateString('es-CO');
}

function mostrarLoaderDashboard() {
    let loader = document.getElementById('dashboard-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'dashboard-loader';
        loader.innerHTML = `
            <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.8); z-index:9999; display:flex; align-items:center; justify-content:center;">
                <div style="text-align:center;">
                    <div style="width:50px; height:50px; border:4px solid #f3f3f3; border-top:4px solid #2560a8; border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <p style="margin-top:16px; color:#0d2247;">Cargando dashboard...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

function ocultarLoaderDashboard() {
    const loader = document.getElementById('dashboard-loader');
    if (loader) loader.style.display = 'none';
}

// Funciones de navegación para eventos
function verDetalleEvento(tipo, id) {
    if (tipo === 'Entrega' || tipo === 'Pedido') {
        mostrarSeccion('pedidos');
        // Opcional: resaltar el pedido específico
    } else if (tipo === 'Alerta') {
        mostrarSeccion('productos');
        // Opcional: resaltar el producto
    }
}

function verNovedad(tipo, id) {
    if (tipo === 'pedido') {
        mostrarSeccion('pedidos');
    } else if (tipo === 'resena') {
        mostrarSeccion('resenas');
    } else if (tipo === 'alerta') {
        mostrarSeccion('productos');
    }
}

// Modificar la función cargarEstadisticas original
const cargarEstadisticasOriginal = window.cargarEstadisticas;
window.cargarEstadisticas = async function() {
    await cargarDashboardReal();
};

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('seccion-dashboard').classList.contains('activo')) {
        cargarDashboardReal();
    }
});

// ============================================
// FUNCIONES PARA HISTORIAL DE NOVEDADES
// ============================================

let paginaActualNovedades = 1;
const itemsPorPagina = 10;
let todasLasNovedades = [];

async function cargarHistorialNovedades(pagina = 1) {
    try {
        // Cargar todos los datos necesarios
        const [pedidos, resenas, productos, solicitudes] = await Promise.all([
            fetch(API + "/pedidos", { headers: { "authorization": token } }).then(r => r.json()),
            fetch(API + "/resenas", { headers: { "authorization": token } }).then(r => r.json()),
            fetch(API + "/productos", { headers: { "authorization": token } }).then(r => r.json()),
            usuario.rol === "superadmin" 
                ? fetch(API + "/solicitudes-cambio", { headers: { "authorization": token } }).then(r => r.json())
                : Promise.resolve([])
        ]);
        
        todasLasNovedades = [];
        
        // Agregar pedidos
        pedidos.forEach(p => {
            todasLasNovedades.push({
                tipo: 'pedido',
                titulo: `Pedido #${p.id}`,
                descripcion: `${p.usuario || 'Cliente'} · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.total)} · ${p.estado}`,
                fecha: new Date(p.created_at),
                color: 'nov-blue',
                id: p.id,
                icono: '📦'
            });
        });
        
        // Agregar reseñas
        resenas.forEach(r => {
            todasLasNovedades.push({
                tipo: 'resena',
                titulo: `Reseña: ${r.producto}`,
                descripcion: `${r.usuario} · ${'★'.repeat(r.calificacion)} (${r.likes} likes)`,
                fecha: new Date(r.created_at),
                color: 'nov-gold',
                id: r.id,
                icono: '⭐'
            });
        });
        
        // Agregar alertas de stock
        productos.filter(p => p.stock < 10).forEach(p => {
            todasLasNovedades.push({
                tipo: 'alerta',
                titulo: `Stock bajo: ${p.nombre}`,
                descripcion: `Quedan ${p.stock} unidades`,
                fecha: new Date(),
                color: 'nov-red',
                id: p.id,
                icono: '⚠️'
            });
        });
        
        // Agregar solicitudes (solo superadmin)
        if (usuario.rol === "superadmin") {
            solicitudes.forEach(s => {
                todasLasNovedades.push({
                    tipo: 'solicitud',
                    titulo: `Solicitud de ${s.nombre}`,
                    descripcion: `Cambiar ${s.campo} · ${s.estado}`,
                    fecha: new Date(s.created_at),
                    color: 'nov-green',
                    id: s.id,
                    icono: '📝'
                });
            });
        }
        
        // Ordenar por fecha (más reciente primero)
        todasLasNovedades.sort((a, b) => b.fecha - a.fecha);
        
        mostrarPaginaNovedades(pagina);
        
    } catch (error) {
        console.error("Error cargando historial:", error);
        mostrarToast("Error al cargar historial de novedades", true);
    }
}

function mostrarPaginaNovedades(pagina) {
    const container = document.getElementById('historialNovedades');
    if (!container) return;
    
    const filtro = document.getElementById('filtroNovedades')?.value || 'todas';
    
    let novedadesFiltradas = todasLasNovedades;
    if (filtro !== 'todas') {
        novedadesFiltradas = todasLasNovedades.filter(n => n.tipo === filtro);
    }
    
    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const novedadesPagina = novedadesFiltradas.slice(inicio, fin);
    
    if (novedadesPagina.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#7a7568;">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p style="margin-top:16px;">No hay novedades para mostrar</p>
            </div>
        `;
        document.getElementById('paginaActualNovedades').textContent = 'Página 0';
        return;
    }
    
    container.innerHTML = novedadesPagina.map(n => {
        const fechaFormateada = n.fecha.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="novedad-historial-item" onclick="irANovedad('${n.tipo}', ${n.id})">
                <div class="novedad-icono ${n.color}">${n.icono}</div>
                <div class="novedad-contenido">
                    <div class="novedad-titulo">${n.titulo}</div>
                    <div class="novedad-descripcion">${n.descripcion}</div>
                    <div class="novedad-fecha">${fechaFormateada}</div>
                </div>
                <div class="novedad-tipo-badge tipo-${n.tipo}">${n.tipo}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('paginaActualNovedades').textContent = `Página ${pagina}`;
}

function filtrarNovedades() {
    mostrarPaginaNovedades(1);
}

function cargarPaginaNovedades(direccion) {
    const filtro = document.getElementById('filtroNovedades')?.value || 'todas';
    let novedadesFiltradas = todasLasNovedades;
    if (filtro !== 'todas') {
        novedadesFiltradas = todasLasNovedades.filter(n => n.tipo === filtro);
    }
    
    const totalPaginas = Math.ceil(novedadesFiltradas.length / itemsPorPagina);
    
    if (direccion === 'siguiente' && paginaActualNovedades < totalPaginas) {
        paginaActualNovedades++;
    } else if (direccion === 'anterior' && paginaActualNovedades > 1) {
        paginaActualNovedades--;
    }
    
    mostrarPaginaNovedades(paginaActualNovedades);
}

function irANovedad(tipo, id) {
    if (tipo === 'pedido') {
        mostrarSeccion('pedidos');
    } else if (tipo === 'resena') {
        mostrarSeccion('resenas');
    } else if (tipo === 'alerta') {
        mostrarSeccion('productos');
    } else if (tipo === 'solicitud') {
        mostrarSeccion('invitaciones');
    }
}

// CSS para el historial de novedades
const novedadesHistorialCSS = `
.novedad-historial-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-soft);
    cursor: pointer;
    transition: background 0.2s;
}

.novedad-historial-item:hover {
    background: var(--cream);
}

.novedad-icono {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.novedad-icono.nov-blue {
    background: #e8f0fb;
    color: #2560a8;
}

.novedad-icono.nov-gold {
    background: #faf0d8;
    color: #b8922a;
}

.novedad-icono.nov-red {
    background: #fdecea;
    color: #c0392b;
}

.novedad-icono.nov-green {
    background: #e4f5ec;
    color: #1e7d4e;
}

.novedad-contenido {
    flex: 1;
}

.novedad-titulo {
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 4px;
}

.novedad-descripcion {
    font-size: 13px;
    color: var(--gray);
    margin-bottom: 4px;
}

.novedad-fecha {
    font-size: 11px;
    color: var(--gray-light);
    font-family: 'JetBrains Mono', monospace;
}

.novedad-tipo-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
}

.tipo-pedido {
    background: #e8f0fb;
    color: #2560a8;
}

.tipo-resena {
    background: #faf0d8;
    color: #b8922a;
}

.tipo-alerta {
    background: #fdecea;
    color: #c0392b;
}

.tipo-solicitud {
    background: #e4f5ec;
    color: #1e7d4e;
}

.btn-pagination {
    padding: 8px 16px;
    border: 1px solid var(--border-soft);
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
}

.btn-pagination:hover {
    background: var(--cream);
    border-color: var(--mid-blue);
    color: var(--mid-blue);
}

body.dark .novedad-historial-item:hover {
    background: #0f172a;
}

body.dark .novedad-titulo {
    color: #f1f5f9;
}

body.dark .btn-pagination {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

body.dark .btn-pagination:hover {
    background: #2560a8;
    border-color: #3b82f6;
    color: white;
}
`;

// Cargar dashboard al iniciar
cargarEstadisticas()