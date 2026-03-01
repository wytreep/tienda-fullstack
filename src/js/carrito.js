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
        resumen.innerHTML = `
            <h2>Resumen del pedido</h2>
            <div class="resumen-linea">
                <span>Subtotal</span>
                <span>$${subtotal.toLocaleString()}</span>
            </div>
            <div class="resumen-cupon">
                <div class="cupon-input-wrap">
                    <input type="text" id="inputCupon" placeholder="Código de descuento" 
                        style="flex:1;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none">
                    <button onclick="aplicarCupon()" 
                        style="padding:9px 14px;background:#1a4480;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">
                        Aplicar
                    </button>
                </div>
                <div id="cuponMensaje"></div>
            </div>
            <div id="lineaDescuento" style="display:none" class="resumen-linea">
                <span style="color:#16a34a">Descuento</span>
                <span style="color:#16a34a" id="valorDescuento">-$0</span>
            </div>
            <div class="resumen-linea">
                <span>Envío</span>
                <span>Gratis</span>
            </div>
            <div class="resumen-total">
                <span>Total</span>
                <span id="totalFinal">$${subtotal.toLocaleString()}</span>
            </div>
            <button class="btn-checkout" onclick="abrirModalDireccion()">Confirmar pedido</button>
            <button class="btn-vaciar" onclick="vaciarCarrito()">Vaciar carrito</button>
        `
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

let cuponAplicado = null

async function aplicarCupon() {
    const codigo = document.getElementById("inputCupon").value.trim().toUpperCase()
    const mensaje = document.getElementById("cuponMensaje")

    if (!codigo) return

    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]")
    const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

    const r = await fetch(API + "/cupones/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "authorization": token },
        body: JSON.stringify({ codigo, total: subtotal })
    })

    const datos = await r.json()

    if (!r.ok) {
        mensaje.innerHTML = `<span style="color:#ef4444;font-size:12px">❌ ${datos.error}</span>`
        cuponAplicado = null
        document.getElementById("lineaDescuento").style.display = "none"
        document.getElementById("totalFinal").textContent = "$" + subtotal.toLocaleString()
        return
    }

    cuponAplicado = datos
    mensaje.innerHTML = `<span style="color:#16a34a;font-size:12px">✓ Cupón aplicado — ${datos.tipo === 'porcentaje' ? datos.valor + '%' : '$' + Number(datos.valor).toLocaleString()} de descuento</span>`
    document.getElementById("lineaDescuento").style.display = "flex"
    document.getElementById("valorDescuento").textContent = "-$" + Number(datos.descuento).toLocaleString()
    document.getElementById("totalFinal").textContent = "$" + Number(datos.total_final).toLocaleString()
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

    const btnConfirmar = document.getElementById("btnConfirmarPedido")
    if (btnConfirmar) { btnConfirmar.disabled = true; btnConfirmar.textContent = "Procesando..." }

    try {
        const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
        const total_final = cuponAplicado ? cuponAplicado.total_final : subtotal
        const respMP = await fetch(API + "/mp/crear-preferencia", {
            
            method: "POST",
            headers: { "Content-Type": "application/json", "authorization": token },
            body: JSON.stringify({
                items: carrito, total, total_final, tipo_envio: tipoEnvioSeleccionado,
                destinatario, cedula, telefono, departamento,
                ciudad, barrio, direccion, indicaciones
            })
        })

        const datosMP = await respMP.json()

        if (!respMP.ok) {
            mostrarToast(datosMP.error || "Error al procesar pago")
            if (btnConfirmar) { btnConfirmar.disabled = false; btnConfirmar.textContent = "Confirmar pedido" }
            return
        }

        localStorage.setItem("carrito", "[]")
        window.location.href = datosMP.init_point

    } catch (error) {
        mostrarToast("Error de conexión")
        if (btnConfirmar) { btnConfirmar.disabled = false; btnConfirmar.textContent = "Confirmar pedido" }
    }
}
function actualizarContador(carrito) {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    document.getElementById("contadorCarrito").textContent = total
}

document.addEventListener("DOMContentLoaded", cargarCarrito)