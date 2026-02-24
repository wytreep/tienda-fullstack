const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("token")

if (!token) window.location.href = "/src/views/login.html"

const usuario = JSON.parse(localStorage.getItem("usuario"))
if (usuario) document.getElementById("nombreUsuario").textContent = usuario.nombre

// Dropdown perfil
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

// Cargar productos
async function cargarProductos(busqueda = "", categoria = "") {
    const respuesta = await fetch(API + "/mis-pedidos", {
        headers: { "authorization": token }
    })
    const datos = await respuesta.json()
    console.log("Respuesta del servidor:", datos)
    
    if (!respuesta.ok) {
        console.error("Error:", datos)
        return
    }
    let productos = await respuesta.json()

    const selectCategoria = document.getElementById("filtroCategoria")
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>'
    categorias.forEach(function(cat) {
        const option = document.createElement("option")
        option.value = cat
        option.textContent = cat
        if (cat === categoria) option.selected = true
        selectCategoria.appendChild(option)
    })

    if (busqueda && typeof busqueda === "string") {
        productos = productos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
    }

    if (categoria) {
        productos = productos.filter(p => p.categoria === categoria)
    }

    renderProductos(productos)
    actualizarCarrito()
}

function renderProductos(productos) {
    const grid = document.getElementById("productosGrid")
    grid.innerHTML = ""

    if (productos.length === 0) {
        grid.innerHTML = "<p style='color:#888'>No se encontraron productos</p>"
        return
    }

    productos.forEach(function(producto) {
        const card = document.createElement("div")
        card.className = "producto-card"
        card.innerHTML = `
            <div class="producto-imagen">
                ${producto.imagen
                    ? `<img src="${API}${producto.imagen}" alt="${producto.nombre}">`
                    : "📦"}
            </div>
            <div class="producto-info">
                <div class="producto-nombre">${producto.nombre}</div>
                <div class="producto-precio">$${Number(producto.precio).toLocaleString()}</div>
                <div class="producto-stock">${producto.stock > 0 ? producto.stock + ' disponibles' : 'Sin stock'}</div>
            </div>
        `
        card.addEventListener("click", function() {
            window.location.href = `producto.html?id=${producto.id}`
        })
        grid.appendChild(card)
    })
}

function actualizarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

document.getElementById("buscador").addEventListener("input", function() {
    const categoria = document.getElementById("filtroCategoria").value
    cargarProductos(this.value, categoria)
})

document.getElementById("filtroCategoria").addEventListener("change", function() {
    const busqueda = document.getElementById("buscador").value
    cargarProductos(busqueda, this.value)
})

document.addEventListener("DOMContentLoaded", cargarProductos)