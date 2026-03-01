const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("token")
if (!token) window.location.href = "/src/views/login.html"

const usuario = JSON.parse(localStorage.getItem("usuario"))
if (usuario) document.getElementById("nombreUsuario").textContent = usuario.nombre

// ===== NAVBAR SCROLL =====
window.addEventListener("scroll", function() {
    const navbar = document.getElementById("navbar")
    if (window.scrollY > 20) navbar.classList.add("scrolled")
    else navbar.classList.remove("scrolled")
})

// ===== DROPDOWN PERFIL =====
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

// ===== CARGAR PRODUCTOS =====
async function cargarProductos(busqueda = "", categoria = "") {
    document.getElementById("loader").style.display = "flex"
    document.getElementById("productosGrid").style.display = "none"

    const respuesta = await fetch(API + "/productos", {
        headers: { "authorization": token }
    })

    if (respuesta.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("usuario")
        window.location.href = "/src/views/login.html"
        return
    }

    let productos = await respuesta.json()

    if (!Array.isArray(productos)) {
        console.error("Error al cargar productos:", productos)
        document.getElementById("loader").style.display = "none"
        return
    }

    document.getElementById("loader").style.display = "none"
    document.getElementById("productosGrid").style.display = "grid"

    // Poblar categorías
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

    // Filtrar
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

function agregarRapido(id, nombre, precio, stock) {
    if (stock === 0) return
    let carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const existente = carrito.find(item => item.id === id)
    if (existente) {
        existente.cantidad += 1
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 })
    }
    localStorage.setItem("carrito", JSON.stringify(carrito))
    actualizarCarrito()
    mostrarToast("✓ Agregado al carrito")
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
    setTimeout(() => toast.classList.remove("activo"), 2800)
}

// ===== RENDER PRODUCTOS =====
function renderProductos(productos) {
    const grid = document.getElementById("productosGrid")
    grid.innerHTML = ""

    if (productos.length === 0) {
        grid.innerHTML = "<p style='color:var(--gray-light);text-align:center;padding:3rem;font-weight:500'>No se encontraron productos</p>"
        return
    }

    productos.forEach(function(producto) {
        const card = document.createElement("div")
        card.className = "producto-card"
        const imgSrc = producto.imagen || null

        card.innerHTML = `
            <div class="producto-imagen">
                ${imgSrc ? `<img src="${imgSrc}" alt="${producto.nombre}">` : "📦"}
                <div class="producto-imagen-overlay"></div>
            </div>
            <div class="producto-info">
                ${producto.categoria ? `<div class="producto-categoria">${producto.categoria}</div>` : ""}
                <div class="producto-nombre">${producto.nombre}</div>
                <div class="producto-stock">${producto.stock > 0 ? producto.stock + ' disponibles' : 'Sin stock'}</div>
                <div class="producto-footer">
                    <div class="producto-precio">$${Number(producto.precio).toLocaleString()}</div>
                    <button class="btn-agregar-rapido" 
                        title="Agregar al carrito"
                        ${producto.stock === 0 ? 'disabled' : ''}
                        onclick="event.stopPropagation(); agregarRapido(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, ${producto.stock})">
                        +
                    </button>
                </div>
            </div>
        `
        card.addEventListener("click", function() {
            window.location.href = `/src/views/producto.html?id=${producto.id}`
        })

        grid.appendChild(card)
    })

    // Ticker dinámico con productos más vendidos
    const tickerWrap = document.getElementById("tickerWrap")
    const tickerInner = document.getElementById("tickerInner")
    if (tickerWrap && tickerInner) {
        tickerWrap.style.display = "block"
        const top = productos.slice()
            .sort((a, b) => (b.veces_vendido || 0) - (a.veces_vendido || 0))
            .slice(0, 8)
        const items = [...top, ...top].map(function(p) {
            return `<div class="ticker-item">
                <strong>${p.nombre}</strong>
                <span class="ticker-sep">✦</span>
                <span style="font-style:italic;font-family:'Playfair Display',serif;color:rgba(245,240,232,0.5);font-size:0.82rem">$${Number(p.precio).toLocaleString()}</span>
                <span class="ticker-sep">·</span>
            </div>`
        }).join("")
        tickerInner.innerHTML = items
    }

    // Stat del hero
    const heroStat = document.getElementById("heroStatNum")
    if (heroStat) heroStat.textContent = productos.length

    observarProductos()
}

// ===== SCROLL REVEAL + TILT 3D =====
function observarProductos() {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry, i) {
            if (entry.isIntersecting) {
                setTimeout(function() {
                    entry.target.classList.add("visible")
                    aplicarTilt(entry.target)
                }, i * 55)
                observer.unobserve(entry.target)
            }
        })
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" })

    document.querySelectorAll(".producto-card:not(.visible)").forEach(function(card) {
        observer.observe(card)
    })
}

function aplicarTilt(card) {
    if (card._tiltActivo) return
    card._tiltActivo = true

    card.addEventListener("mousemove", function(e) {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cx = rect.width / 2
        const cy = rect.height / 2
        const rotY = ((x - cx) / cx) * 10
        const rotX = ((cy - y) / cy) * 8
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`
        card.style.boxShadow = `${-rotY * 1.5}px ${rotX * 1.5}px 28px rgba(17,16,8,0.13)`
        card.style.transition = "transform 0.08s ease, box-shadow 0.08s ease"
    })

    card.addEventListener("mouseleave", function() {
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)"
        card.style.boxShadow = ""
        card.style.transition = "transform 0.4s ease, box-shadow 0.4s ease"
    })
}

// ===== CARRITO =====
function actualizarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

// ===== BUSCADOR Y FILTRO =====
document.getElementById("buscador").addEventListener("input", function() {
    cargarProductos(this.value, document.getElementById("filtroCategoria").value)
})

document.getElementById("filtroCategoria").addEventListener("change", function() {
    cargarProductos(document.getElementById("buscador").value, this.value)
})

document.addEventListener("DOMContentLoaded", cargarProductos)