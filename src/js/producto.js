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

// Obtener ID del producto de la URL
const params = new URLSearchParams(window.location.search)
const productoId = params.get("id")

let cantidad = 1

async function cargarProducto() {
    const respuesta = await fetch(API + "/productos/" + productoId, {
        headers: { "authorization": token }
    })
    const producto = await respuesta.json()
    renderProducto(producto)
    actualizarCarrito()
}

function renderProducto(producto) {
    const contenedor = document.getElementById("productoDetalle")
    const sinStock = producto.stock === 0
    stockDisponible = producto.stock

    contenedor.innerHTML = `
        <div class="producto-detalle-imagen">
            ${producto.imagen
                ? `<img src="${API}${producto.imagen}" alt="${producto.nombre}">`
                : "📦"}
        </div>
        <div class="producto-detalle-info">
            <p class="producto-detalle-categoria">${producto.categoria || "General"}</p>
            <h1>${producto.nombre}</h1>
            <div class="producto-detalle-precio">$${Number(producto.precio).toLocaleString()}</div>
            <p class="producto-detalle-descripcion">${producto.descripcion || "Sin descripción disponible"}</p>
            <p class="producto-detalle-stock">${sinStock ? "Sin stock" : producto.stock + " unidades disponibles"}</p>
            <div class="cantidad-selector">
                <button onclick="cambiarCantidad(-1)">−</button>
                <span id="cantidad">1</span>
                <button onclick="cambiarCantidad(1)">+</button>
            </div>
            <button class="btn-agregar-carrito" 
                onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio}, ${producto.stock})"
                ${sinStock ? "disabled" : ""}>
                ${sinStock ? "Sin stock" : "Agregar al carrito"}
            </button>
        </div>
    `
}

let stockDisponible = 0

function cambiarCantidad(valor) {
    cantidad = Math.max(1, Math.min(stockDisponible, cantidad + valor))
    document.getElementById("cantidad").textContent = cantidad
}

function agregarAlCarrito(id, nombre, precio, stock) {
    if (cantidad > stockDisponible) {
        mostrarToast("No hay suficiente stock")
        return
    }

    let carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const existente = carrito.find(item => item.id === id)

    if (existente) {
        existente.cantidad += cantidad
    } else {
        carrito.push({ id, nombre, precio, cantidad })
    }

    localStorage.setItem("carrito", JSON.stringify(carrito))
    actualizarCarrito()
    mostrarToast("✓ Producto agregado al carrito")
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

function actualizarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

document.addEventListener("DOMContentLoaded", cargarProducto)