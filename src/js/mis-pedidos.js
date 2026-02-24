const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("token")

if (!token) window.location.href = "login/login.html"

const usuario = JSON.parse(localStorage.getItem("usuario"))
if (usuario) document.getElementById("nombreUsuario").textContent = usuario.nombre

document.getElementById("btnPerfil").addEventListener("click", function(e) {
    e.stopPropagation()
    document.getElementById("perfilDropdown").classList.toggle("activo")
})

document.addEventListener("click", function(e) {
    if (!e.target.closest(".perfil-menu")) {
        document.getElementById("perfilDropdown").classList.remove("activo")
    }
})

document.getElementById("btnCerrarSesion").addEventListener("click", function() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "login/login.html"
})
document.getElementById("btnCambiarPassword").addEventListener("click", function() {
    window.location.href = "/src/views/cambiar-password.html"
})

document.getElementById("btnCambiarCuenta").addEventListener("click", function() {
    const cuentas = JSON.parse(localStorage.getItem("cuentas") || "[]")
    const lista = document.getElementById("listaCuentasModal")

    if (cuentas.length === 0) {
        alert("No tienes cuentas guardadas")
        return
    }

    lista.innerHTML = ""
    cuentas.forEach(function(cuenta) {
        const item = document.createElement("div")
        item.className = "cuenta-modal-item"
        item.innerHTML = `
            <div>
                <div class="cuenta-modal-nombre">${cuenta.nombre}</div>
                <div class="cuenta-modal-email">${cuenta.email}</div>
            </div>
        `
        item.addEventListener("click", async function() {
            const respuesta = await fetch(API + "/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cuenta.email, password: cuenta.password })
            })
            const datos = await respuesta.json()
            if (respuesta.ok) {
                localStorage.setItem("token", datos.token)
                localStorage.setItem("usuario", JSON.stringify(datos.usuario))
                window.location.reload()
            }
        })
        lista.appendChild(item)
    })

    document.getElementById("modalCuentas").classList.add("activo")
    document.getElementById("perfilDropdown").classList.remove("activo")
})

document.getElementById("btnCancelarCuentas").addEventListener("click", function() {
    document.getElementById("modalCuentas").classList.remove("activo")
})

function estadoIndex(estado) {
    if (estado === "pendiente") return 0
    if (estado === "enviado") return 1
    if (estado === "entregado") return 2
    return 0
}

async function cargarPedidos() {
    const respuesta = await fetch(API + "/mis-pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await respuesta.json()
    const contenedor = document.getElementById("listaPedidos")

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        contenedor.innerHTML = `
            <div class="pedido-vacio">
                <p style="font-size:3rem">📦</p>
                <p>No tienes pedidos aún</p>
                <a href="index.html" style="color:#2563eb">Ver productos</a>
            </div>
        `
        return
    }

    const pasos = ["Pendiente", "Enviado", "Entregado"]
    const iconos = ["⏳", "🚚", "✅"]

    contenedor.innerHTML = ""
    pedidos.forEach(function(pedido) {
        const items = pedido.items || []
        const idx = estadoIndex(pedido.estado)

        const timelineHTML = pasos.map(function(paso, i) {
            let clase = ""
            if (i < idx) clase = "completado"
            else if (i === idx) clase = "activo"
            return `
                <div class="timeline-paso">
                    <div class="timeline-circulo ${clase}">${iconos[i]}</div>
                    <div class="timeline-label">${paso}</div>
                </div>
            `
        }).join("")

        const itemsHTML = items.map(function(item) {
            return `
                <div class="pedido-item">
                    <span>${item.nombre} x${item.cantidad}</span>
                    <span>$${Number(item.precio * item.cantidad).toLocaleString()}</span>
                </div>
            `
        }).join("")

        const div = document.createElement("div")
        div.className = "pedido-card"
        div.innerHTML = `
            <div class="pedido-header">
                <span class="pedido-id">Pedido #${pedido.id}</span>
                <span class="pedido-fecha">${new Date(pedido.created_at).toLocaleDateString()}</span>
                <span class="pedido-total">$${Number(pedido.total).toLocaleString()}</span>
                <span class="pedido-estado estado-${pedido.estado}">${pedido.estado}</span>
            </div>
            <div class="pedido-items">${itemsHTML}</div>
            <div class="timeline">${timelineHTML}</div>
        `
        contenedor.appendChild(div)
    })

    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}
document.addEventListener("DOMContentLoaded", cargarPedidos)