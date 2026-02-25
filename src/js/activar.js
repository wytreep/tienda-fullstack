const API = "https://mi-servidor-2mff.onrender.com"
const params = new URLSearchParams(window.location.search)
const token = params.get("token")

async function verificarToken() {
    if (!token) {
        mostrarError("Link inválido")
        return
    }

    const respuesta = await fetch(API + "/invitaciones/" + token)
    const datos = await respuesta.json()

    if (!respuesta.ok) {
        mostrarError(datos.error)
        return
    }

    document.getElementById("subtitulo").textContent = "Bienvenido — " + datos.email
    document.getElementById("activarForm").style.display = "flex"
    document.getElementById("linkVolver").style.display = "block"
}

function mostrarError(mensaje) {
    document.getElementById("subtitulo").textContent = mensaje
    document.getElementById("contenido").querySelector(".logo-container div:first-child").textContent = "❌"
    document.getElementById("linkVolver").style.display = "block"
}

function mostrarToast(mensaje, error = false) {
    let toast = document.getElementById("toast")
    if (!toast) {
        toast = document.createElement("div")
        toast.id = "toast"
        document.body.appendChild(toast)
    }
    toast.textContent = mensaje
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem;
        background: ${error ? "#ef4444" : "#22c55e"};
        color: #fff; padding: 12px 24px;
        border-radius: 8px; font-weight: 500;
        z-index: 9999;
    `
    setTimeout(function() { toast.style.display = "none" }, 3000)
}

document.getElementById("activarForm").addEventListener("submit", async function(e) {
    e.preventDefault()

    const nombre = document.getElementById("nombre").value.trim()
    const password = document.getElementById("password").value
    const confirmar = document.getElementById("confirmar").value

    if (!nombre) {
        mostrarToast("Escribe tu nombre", true)
        return
    }

    if (password !== confirmar) {
        mostrarToast("Las contraseñas no coinciden", true)
        return
    }

    if (password.length < 6) {
        mostrarToast("La contraseña debe tener al menos 6 caracteres", true)
        return
    }

    const respuesta = await fetch(API + "/invitaciones/" + token + "/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, password })
    })

    const datos = await respuesta.json()

    if (respuesta.ok) {
        mostrarToast("✓ Cuenta activada correctamente")
        setTimeout(function() {
            window.location.href = "/src/views/admin-login.html"
        }, 1500)
    } else {
        mostrarToast(datos.error, true)
    }
})

document.addEventListener("DOMContentLoaded", verificarToken)