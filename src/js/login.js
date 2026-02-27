const API = "https://mi-servidor-2mff.onrender.com"

// Cargar cuentas guardadas
function cargarCuentasGuardadas() {
    const cuentas = JSON.parse(localStorage.getItem("cuentas") || "[]")
    const contenedor = document.getElementById("cuentasGuardadas")
    const lista = document.getElementById("listaCuentas")

    if (cuentas.length === 0) return

    contenedor.style.display = "block"
    lista.innerHTML = ""

    cuentas.forEach(function(cuenta, index) {
        const item = document.createElement("div")
        item.className = "cuenta-item"
        item.innerHTML = `
            <div onclick="seleccionarCuenta(${index})">
                <div class="cuenta-nombre">${cuenta.nombre}</div>
                <div class="cuenta-email">${cuenta.email}</div>
            </div>
            <button class="btn-eliminar-cuenta" onclick="eliminarCuenta(${index})">✕</button>
        `
        lista.appendChild(item)
    })
}

function seleccionarCuenta(index) {
    const cuentas = JSON.parse(localStorage.getItem("cuentas") || "[]")
    const cuenta = cuentas[index]
    document.querySelector('input[name="email"]').value = cuenta.email
    document.querySelector('input[name="password"]').value = cuenta.password
}

function eliminarCuenta(index) {
    let cuentas = JSON.parse(localStorage.getItem("cuentas") || "[]")
    cuentas.splice(index, 1)
    localStorage.setItem("cuentas", JSON.stringify(cuentas))
    cargarCuentasGuardadas()
}

cargarCuentasGuardadas()
document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault()

    const email = document.querySelector('input[name="email"]').value
    const password = document.querySelector('input[name="password"]').value

    try {
        const respuesta = await fetch(API + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })

        const datos = await respuesta.json()

if (respuesta.ok) {
    // Primero verificar rol ANTES de guardar
    if (datos.usuario.rol === "admin" || datos.usuario.rol === "superadmin") {
        mostrarToast("Usa el panel de administrador para iniciar sesión", true)
        return
    }

    // Solo guardar si es usuario normal
    localStorage.setItem("token", datos.token)
    localStorage.setItem("usuario", JSON.stringify(datos.usuario))

    const recordar = document.getElementById("recordarme").checked
    if (recordar) {
        let cuentas = JSON.parse(localStorage.getItem("cuentas") || "[]")
        const yaExiste = cuentas.find(c => c.email === email)
        if (!yaExiste) {
            cuentas.push({ email, password, nombre: datos.usuario.nombre })
            localStorage.setItem("cuentas", JSON.stringify(cuentas))
        }
    }

    window.location.href = "/src/views/index.html"
}else {
            alert(datos.error)
        }
    } catch (error) {
        alert("Error al conectar con el servidor")
    }
})