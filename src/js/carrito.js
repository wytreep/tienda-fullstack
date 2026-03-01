const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("token")

if (!token) window.location.href = "/src/views/login.html"

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
    window.location.href = "/src/views/login.html"
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

function cargarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const contenedor = document.getElementById("carritoItems")
    const resumen = document.getElementById("carritoResumen")

    actualizarContador(carrito)

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <p style="font-size:3rem">🛒</p>
                <p>Tu carrito está vacío</p>
                <a href="index.html" style="color:#2563eb">Ver productos</a>
            </div>
        `
        resumen.innerHTML = ""
        return
    }

    contenedor.innerHTML = ""
    carrito.forEach(function(item) {
        const div = document.createElement("div")
        div.className = "carrito-item"
        div.innerHTML = `
            <div class="carrito-item-imagen">📦</div>
            <div class="carrito-item-info">
                <div class="carrito-item-nombre">${item.nombre}</div>
                <div class="carrito-item-precio">$${Number(item.precio).toLocaleString()}</div>
            </div>
            <div class="carrito-item-acciones">
                <button onclick="cambiarCantidad(${item.id}, -1)">−</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
            </div>
            <button class="btn-eliminar-item" onclick="eliminarItem(${item.id})">✕</button>
        `
        contenedor.appendChild(div)
    })

    const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

    resumen.innerHTML = `
        <h2>Resumen del pedido</h2>
        <div class="resumen-linea">
            <span>Subtotal</span>
            <span>$${subtotal.toLocaleString()}</span>
        </div>
        <div class="resumen-linea">
            <span>Envío</span>
            <span>Gratis</span>
        </div>
        <div class="resumen-total">
            <span>Total</span>
            <span>$${subtotal.toLocaleString()}</span>
        </div>
        <button class="btn-checkout" onclick="abrirModalDireccion()">Confirmar pedido</button>
        <button class="btn-vaciar" onclick="vaciarCarrito()">Vaciar carrito</button>
    `
}

function cambiarCantidad(id, valor) {
    let carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const item = carrito.find(i => i.id === id)
    if (item) {
        item.cantidad += valor
        if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id)
    }
    localStorage.setItem("carrito", JSON.stringify(carrito))
    cargarCarrito()
}

function eliminarItem(id) {
    let carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    carrito = carrito.filter(i => i.id !== id)
    localStorage.setItem("carrito", JSON.stringify(carrito))
    cargarCarrito()
}

function mostrarToast(mensaje) {
    let toast = document.getElementById("toast")
    if (!toast) {
        toast = document.createElement("div")
        toast.id = "toast"
        toast.className = "toast"
        document.body.appendChild(toast)
    }
    toast.textContent = mensaje
    toast.classList.add("activo")
    setTimeout(function() {
        toast.classList.remove("activo")
    }, 3000)
}

function vaciarCarrito() {
    localStorage.removeItem("carrito")
    cargarCarrito()
}

let tipoEnvioSeleccionado = "nacional"

function cambiarTipoEnvio(tipo) {
    tipoEnvioSeleccionado = tipo
    document.getElementById("btnNacional").classList.toggle("activo", tipo === "nacional")
    document.getElementById("btnLocal").classList.toggle("activo", tipo === "local")
    document.getElementById("camposNacional").style.display = tipo === "nacional" ? "block" : "none"
}

function abrirModalDireccion() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    if (carrito.length === 0) return
    document.getElementById("modalDireccion").classList.add("activo")
}

document.getElementById("btnCancelarDireccion").addEventListener("click", function() {
    document.getElementById("modalDireccion").classList.remove("activo")
})

async function confirmarPedido() {
    const destinatario = document.getElementById("envDestinatario").value.trim()
    const cedula = document.getElementById("envCedula").value.trim()
    const telefono = document.getElementById("envTelefono").value.trim()
    const barrio = document.getElementById("envBarrio").value.trim()
    const direccion = document.getElementById("envDireccion").value.trim()
    const indicaciones = document.getElementById("envIndicaciones").value.trim()
    const departamento = tipoEnvioSeleccionado === "nacional" ? document.getElementById("envDepartamento").value.trim() : ""
    const ciudad = tipoEnvioSeleccionado === "nacional" ? document.getElementById("envCiudad").value.trim() : ""

    if (!destinatario || !cedula || !telefono || !barrio || !direccion) {
        mostrarToast("Completa todos los campos obligatorios")
        return
    }

    if (tipoEnvioSeleccionado === "nacional" && (!departamento || !ciudad)) {
        mostrarToast("Completa departamento y ciudad")
        return
    }

    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

    // 1 — Crear pedido
    const respPedido = await fetch(API + "/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "authorization": token },
        body: JSON.stringify({
            items: carrito, total, tipo_envio: tipoEnvioSeleccionado,
            destinatario, cedula, telefono, departamento, ciudad, barrio, direccion, indicaciones
        })
    })

    const datosPedido = await respPedido.json()
    if (!respPedido.ok) {
        mostrarToast(datosPedido.error)
        return
    }

    // 2 — Crear preferencia de pago en MercadoPago
    const respMP = await fetch(API + "/mp/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json", "authorization": token },
        body: JSON.stringify({ items: carrito, pedido_id: datosPedido.id })
    })

    const datosMP = await respMP.json()

    if (!respMP.ok) {
        // Si falla MP el pedido ya existe, redirigir a mis pedidos
        mostrarToast("Pedido creado. Redirigiendo...")
        localStorage.setItem("carrito", "[]")
        setTimeout(() => window.location.href = "/src/views/mis-pedidos.html", 1500)
        return
    }

    // 3 — Limpiar carrito y redirigir a MercadoPago
    localStorage.setItem("carrito", "[]")
    document.getElementById("modalDireccion").classList.remove("activo")
    window.location.href = datosMP.init_point
}
function actualizarContador(carrito) {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

document.addEventListener("DOMContentLoaded", cargarCarrito)