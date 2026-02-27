
const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("admin-token")
const usuario = JSON.parse(localStorage.getItem("admin-usuario"))

if (!token || !usuario || (usuario.rol !== "admin" && usuario.rol !== "superadmin")) {
    window.location.href = "admin-login.html"
}
const esSuperAdmin = usuario.rol === "superadmin"

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
    document.getElementById("tituloSeccion").textContent =
        nombre.charAt(0).toUpperCase() + nombre.slice(1)
    if (event) event.target.classList.add("activo")

    if (nombre === "configuracion") {} // no necesita cargar datos
    if (nombre === "dashboard") cargarEstadisticas()
    if (nombre === "productos") cargarProductos()
    if (nombre === "pedidos") cargarPedidos()
    if (nombre === "usuarios") cargarUsuarios()
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
// ===== DASHBOARD =====
let grafVentasChart = null
let grafEstadosChart = null

async function cargarEstadisticas() {
    const r = await fetch(API + "/estadisticas", {
        headers: { "authorization": token }
    })
    const stats = await r.json()

    animarNumero("statProductos", stats.productos)
    animarNumero("statPedidos", stats.pedidos)
    animarNumero("statUsuarios", stats.usuarios)
    document.getElementById("statVentas").textContent = "$" + Number(stats.ventas).toLocaleString()

    document.getElementById("bannerProductos").textContent = stats.productos
    document.getElementById("bannerPedidos").textContent = stats.pedidos
    document.getElementById("bannerUsuarios").textContent = stats.usuarios

    const ahora = new Date()
    document.getElementById("bannerFecha").textContent = ahora.toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    })

    const partes = usuario.nombre.split(" ")
    document.getElementById("bannerNombre").innerHTML = `${partes[0]} <em>${partes[1] || ""}</em>`

    await cargarGraficos()
    await cargarPedidosRecientes()
    await cargarTopProductos()
    await cargarAlertas()
}

function animarNumero(id, fin) {
    const el = document.getElementById(id)
    if (!el) return
    const duracion = 800
    const inicio = Date.now()
    function paso() {
        const progreso = Math.min((Date.now() - inicio) / duracion, 1)
        const val = Math.floor(fin * (1 - Math.pow(1 - progreso, 3)))
        el.textContent = val
        if (progreso < 1) requestAnimationFrame(paso)
        else el.textContent = fin
    }
    requestAnimationFrame(paso)
}

async function cargarGraficos() {
    const r = await fetch(API + "/pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await r.json()

    // Gráfico ventas por mes
    const meses = {}
    pedidos.forEach(function(p) {
        if (p.estado === "cancelado") return
        const fecha = new Date(p.created_at)
        const key = fecha.toLocaleDateString("es-CO", { month: "short", year: "2-digit" })
        meses[key] = (meses[key] || 0) + Number(p.total)
    })

    const labelsVentas = Object.keys(meses).slice(-6)
    const dataVentas = labelsVentas.map(k => meses[k])

    if (grafVentasChart) grafVentasChart.destroy()
    const ctxV = document.getElementById("grafVentas").getContext("2d")
    const gradiente = ctxV.createLinearGradient(0, 0, 0, 200)
    gradiente.addColorStop(0, "rgba(37,96,168,0.22)")
    gradiente.addColorStop(1, "rgba(37,96,168,0)")

    grafVentasChart = new Chart(ctxV, {
        type: "line",
        data: {
            labels: labelsVentas.length ? labelsVentas : ["Sin datos"],
            datasets: [{
                label: "Ventas",
                data: dataVentas.length ? dataVentas : [0],
                borderColor: "#2560a8",
                backgroundColor: gradiente,
                borderWidth: 2.5,
                pointBackgroundColor: "#2560a8",
                pointRadius: 4,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => " $" + Number(ctx.raw).toLocaleString() } }
            },
            scales: {
                y: {
                    grid: { color: "rgba(0,0,0,0.04)" },
                    ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#94a3b8", callback: v => "$" + Number(v).toLocaleString() }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#94a3b8" }
                }
            }
        }
    })

    // Gráfico dona estados
    const estadoConteo = {}
    const estadoColores = {
        pendiente: "#fbbf24", procesando: "#38bdf8", empacado: "#a78bfa",
        enviado: "#60a5fa", entregado: "#34d399", cancelado: "#f87171"
    }

    pedidos.forEach(p => { estadoConteo[p.estado] = (estadoConteo[p.estado] || 0) + 1 })

    const labelsEstados = Object.keys(estadoConteo)
    const dataEstados = labelsEstados.map(k => estadoConteo[k])
    const coloresEstados = labelsEstados.map(k => estadoColores[k] || "#94a3b8")

    document.getElementById("donaTotalNum").textContent = pedidos.length

    if (grafEstadosChart) grafEstadosChart.destroy()
    const ctxE = document.getElementById("grafEstados").getContext("2d")

    grafEstadosChart = new Chart(ctxE, {
        type: "doughnut",
        data: {
            labels: labelsEstados,
            datasets: [{
                data: dataEstados,
                backgroundColor: coloresEstados,
                borderWidth: 3,
                borderColor: document.body.classList.contains("dark") ? "#0f1c35" : "#fff",
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            cutout: "68%",
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} pedidos` } }
            }
        }
    })

    const leyenda = document.getElementById("donaLeyenda")
    leyenda.innerHTML = labelsEstados.map((estado, i) => `
        <div class="dona-item">
            <div class="dona-dot" style="background:${coloresEstados[i]}"></div>
            ${estado} (${dataEstados[i]})
        </div>
    `).join("")
}

async function cargarPedidosRecientes() {
    const r = await fetch(API + "/pedidos", { headers: { "authorization": token } })
    const pedidos = await r.json()
    const tbody = document.getElementById("tbodyPedidosRecientes")
    const recientes = pedidos.slice(0, 6)

    if (!recientes.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px;font-family:'JetBrains Mono',monospace;font-size:11px">No hay pedidos aún</td></tr>`
        return
    }

    tbody.innerHTML = recientes.map(p => `
        <tr onclick="mostrarSeccion('pedidos', event)" style="cursor:pointer">
            <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gray)">#${p.id}</span></td>
            <td>
                <div style="font-weight:600;font-size:13px">${p.usuario}</div>
            </td>
            <td><span style="font-family:'Libre Baskerville',serif;font-weight:700;color:var(--navy)">$${Number(p.total).toLocaleString()}</span></td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
            <td><span style="font-size:11px;color:var(--gray);font-family:'JetBrains Mono',monospace">${new Date(p.created_at).toLocaleDateString("es-CO")}</span></td>
        </tr>
    `).join("")
}

async function cargarTopProductos() {
    const rProd = await fetch(API + "/productos", { headers: { "authorization": token } })
    const productos = await rProd.json()

    const topData = productos
        .sort((a, b) => b.precio - a.precio)
        .slice(0, 5)

    const contenedor = document.getElementById("topProductos")
    if (!topData.length) {
        contenedor.innerHTML = `<p style="text-align:center;color:var(--gray);font-size:12px;padding:16px;font-family:'JetBrains Mono',monospace">Sin productos</p>`
        return
    }

    const maxVal = Math.max(...topData.map(p => p.precio))
    const colores = ["#2560a8", "#1e7d4e", "#b8922a", "#7d3c98", "#c0392b"]

    contenedor.innerHTML = topData.map((p, i) => {
        const pct = Math.round((p.precio / maxVal) * 100)
        return `
            <div class="top-producto-item" onclick="mostrarSeccion('productos', event)">
                <div class="top-producto-rank">${i + 1}</div>
                <div class="top-producto-info">
                    <div class="top-producto-nombre">${p.nombre}</div>
                    <div class="top-producto-barra-wrap">
                        <div class="top-producto-barra" style="width:${pct}%;background:${colores[i]}"></div>
                    </div>
                </div>
                <div class="top-producto-ventas">$${Number(p.precio).toLocaleString()}</div>
            </div>
        `
    }).join("")
}

async function cargarAlertas() {
    const alertas = []

    const rProd = await fetch(API + "/productos", { headers: { "authorization": token } })
    const productos = await rProd.json()
    const sinStock = productos.filter(p => p.stock === 0)
    const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= 3)

    sinStock.forEach(p => alertas.push({ tipo: "error", texto: `❌ Sin stock: <strong>${p.nombre}</strong>`, seccion: "productos" }))
    stockBajo.forEach(p => alertas.push({ tipo: "warn", texto: `⚠️ Stock bajo: <strong>${p.nombre}</strong> — ${p.stock} uds`, seccion: "productos" }))

    const rPed = await fetch(API + "/pedidos", { headers: { "authorization": token } })
    const pedidos = await rPed.json()

    const canceladosHoy = pedidos.filter(p => {
        return p.estado === "cancelado" && new Date(p.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    })

    const pendientesViejos = pedidos.filter(p => {
        return p.estado === "pendiente" && new Date(p.created_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    })

    if (canceladosHoy.length) alertas.push({ tipo: "error", texto: `❌ ${canceladosHoy.length} pedido(s) cancelado(s) hoy`, seccion: "pedidos" })
    if (pendientesViejos.length) alertas.push({ tipo: "warn", texto: `⏳ ${pendientesViejos.length} pedido(s) pendiente(s) hace más de 2 días`, seccion: "pedidos" })

    const contenedor = document.getElementById("alertasSistema")
    contenedor.innerHTML = alertas.length
        ? alertas.map(a => `<div class="dash-alerta dash-alerta-${a.tipo}" onclick="mostrarSeccion('${a.seccion}', event)">${a.texto}</div>`).join("")
        : `<div class="dash-alerta dash-alerta-ok">✓ Todo en orden, sin alertas pendientes</div>`
}
document.getElementById("adminAvatar").textContent = usuario.nombre.charAt(0).toUpperCase()
document.getElementById("adminRol").textContent = esSuperAdmin ? "Super Admin" : "Administrador"
document.getElementById("adminTagRol").textContent = esSuperAdmin ? "SUPER ADMIN" : "ADMIN"

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
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>#${p.id}</td>
            <td>${p.usuario}</td>
            <td>$${Number(p.total).toLocaleString()}</td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
            <td>${new Date(p.created_at).toLocaleDateString()}</td>
            <td>
                <select onchange="cambiarEstadoPedido(${p.id}, this.value)">
                    <option ${p.estado === 'pendiente' ? 'selected' : ''}>pendiente</option>
                    <option ${p.estado === 'enviado' ? 'selected' : ''}>enviado</option>
                    <option ${p.estado === 'entregado' ? 'selected' : ''}>entregado</option>
                </select>
            </td>
        `
        tbody.appendChild(tr)
    })
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

// Cargar dashboard al iniciar
cargarEstadisticas()