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
let calificacionSeleccionada = 0

document.querySelectorAll(".estrella").forEach(function(estrella) {
    estrella.addEventListener("mouseover", function() {
        const valor = parseInt(this.dataset.valor)
        document.querySelectorAll(".estrella").forEach(function(e, i) {
            e.classList.toggle("activa", i < valor)
        })
    })

    estrella.addEventListener("mouseout", function() {
        document.querySelectorAll(".estrella").forEach(function(e, i) {
            e.classList.toggle("activa", i < calificacionSeleccionada)
        })
    })

    estrella.addEventListener("click", function() {
        calificacionSeleccionada = parseInt(this.dataset.valor)
        document.querySelectorAll(".estrella").forEach(function(e, i) {
            e.classList.toggle("activa", i < calificacionSeleccionada)
        })
    })
})

async function enviarResena() {
    if (calificacionSeleccionada === 0) {
        mostrarToast("Selecciona una calificación", true)
        return
    }

    const comentario = document.getElementById("comentarioResena").value.trim()
    if (!comentario) {
        mostrarToast("Escribe un comentario", true)
        return
    }

    const respuesta = await fetch(API + "/resenas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({
            producto_id: productoId,
            calificacion: calificacionSeleccionada,
            comentario
        })
    })

    const datos = await respuesta.json()

    if (respuesta.ok) {
        mostrarToast("✓ Reseña publicada")
        document.getElementById("comentarioResena").value = ""
        calificacionSeleccionada = 0
        document.querySelectorAll(".estrella").forEach(e => e.classList.remove("activa"))
        cargarResenas()
    } else {
        mostrarToast(datos.error, true)
    }
}

async function cargarResenas() {
    const respuesta = await fetch(API + "/resenas/" + productoId, {
        headers: { "authorization": token }
    })
    const resenas = await respuesta.json()
    const lista = document.getElementById("listaResenas")

    if (resenas.length === 0) {
        lista.innerHTML = "<div class='resenas-vacio'>No hay reseñas aún. ¡Sé el primero!</div>"
        return
    }

    lista.innerHTML = ""

    for (const r of resenas) {
        const estrellas = "★".repeat(r.calificacion) + "☆".repeat(5 - r.calificacion)

        // Cargar likes y respuestas
        const [likesRes, respuestasRes] = await Promise.all([
            fetch(API + "/resenas/" + r.id + "/likes", { headers: { "authorization": token } }),
            fetch(API + "/resenas/" + r.id + "/respuestas", { headers: { "authorization": token } })
        ])
        const likesData = await likesRes.json()
        const respuestas = await respuestasRes.json()

        const respuestasHTML = respuestas.map(function(resp) {
            return `
                <div class="resena-respuesta ${resp.es_admin ? 'respuesta-admin' : ''}">
                    <div class="respuesta-autor">
                        ${resp.es_admin ? '🏪 Tienda' : resp.nombre}
                        ${resp.es_admin ? '<span class="badge-admin">Admin</span>' : ''}
                    </div>
                    <div class="respuesta-texto">${resp.comentario}</div>
                    <div class="respuesta-fecha">${new Date(resp.created_at).toLocaleDateString()}</div>
                </div>
            `
        }).join("")

        const div = document.createElement("div")
        div.className = "resena-card"
        div.innerHTML = `
            <div class="resena-header">
                <span class="resena-autor">${r.nombre}</span>
                <span class="resena-fecha">${new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div class="resena-estrellas">${estrellas}</div>
            <p class="resena-comentario">${r.comentario}</p>
            <div class="resena-acciones">
                <button class="btn-like ${likesData.liked ? 'liked' : ''}" onclick="toggleLike(${r.id}, this)">
                    👍 <span class="like-count">${likesData.total}</span>
                </button>
                <button class="btn-responder" onclick="toggleRespuesta(${r.id})">
                    💬 Responder
                </button>
            </div>
            <div class="resena-respuestas" id="respuestas-${r.id}">
                ${respuestasHTML}
            </div>
            <div class="respuesta-form" id="form-respuesta-${r.id}" style="display:none">
                <textarea class="respuesta-input" id="input-respuesta-${r.id}" placeholder="Escribe tu respuesta..." rows="2"></textarea>
                <button class="btn-enviar-respuesta" onclick="enviarRespuesta(${r.id})">Enviar</button>
            </div>
        `
        lista.appendChild(div)
    }
}

async function toggleLike(resenaId, btn) {
    const respuesta = await fetch(API + "/resenas/" + resenaId + "/like", {
        method: "POST",
        headers: { "authorization": token }
    })
    const datos = await respuesta.json()
    if (respuesta.ok) {
        btn.classList.toggle("liked", datos.liked)
        const count = btn.querySelector(".like-count")
        count.textContent = parseInt(count.textContent) + (datos.liked ? 1 : -1)
    }
}

function toggleRespuesta(resenaId) {
    const form = document.getElementById("form-respuesta-" + resenaId)
    form.style.display = form.style.display === "none" ? "block" : "none"
}

async function enviarRespuesta(resenaId) {
    const comentario = document.getElementById("input-respuesta-" + resenaId).value.trim()
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
        cargarResenas()
    }
}

async function toggleLike(resenaId, btn) {
    const respuesta = await fetch(API + "/resenas/" + resenaId + "/like", {
        method: "POST",
        headers: { "authorization": token }
    })
    const datos = await respuesta.json()
    if (respuesta.ok) {
        const btnActual = document.querySelector(`[onclick="toggleLike(${resenaId}, this)"]`)
        if (btnActual) {
            btnActual.classList.toggle("liked", datos.liked)
            const count = btnActual.querySelector(".like-count")
            count.textContent = parseInt(count.textContent) + (datos.liked ? 1 : -1)
        }
    }
}

function toggleRespuesta(resenaId) {
    const form = document.getElementById("form-respuesta-" + resenaId)
    form.style.display = form.style.display === "none" ? "flex" : "none"
}

async function enviarRespuesta(resenaId) {
    const input = document.getElementById("input-respuesta-" + resenaId)
    const comentario = input.value.trim()
    if (!comentario) return

    const respuesta = await fetch(API + "/resenas/" + resenaId + "/respuestas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ comentario })
    })

    if (respuesta.ok) {
        mostrarToast("✓ Respuesta publicada")
        input.value = ""
        cargarResenas()
    }
}

document.addEventListener("DOMContentLoaded", cargarProducto)