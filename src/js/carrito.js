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
        <button class="btn-checkout" onclick="realizarPedido()">Realizar pedido</button>
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

async function realizarPedido() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    if (carrito.length === 0) return

    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

    try {
        const respuesta = await fetch(API + "/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": token
            },
            body: JSON.stringify({ items: carrito, total })
        })

        if (respuesta.ok) {
            mostrarToast("✓ Pedido realizado. ¡Gracias por tu compra!")
            setTimeout(function() {
                localStorage.removeItem("carrito")
                cargarCarrito()
            }, 1500)
        } else {
            mostrarToast("Error al realizar el pedido")
        }
    } catch (error) {
        mostrarToast("Error al conectar con el servidor")
    }
}
function actualizarContador(carrito) {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

document.addEventListener("DOMContentLoaded", cargarCarrito)