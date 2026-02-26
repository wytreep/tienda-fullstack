const API = "https://mi-servidor-2mff.onrender.com"
const token = localStorage.getItem("token")
const usuario = JSON.parse(localStorage.getItem("usuario"))

if (!token || !usuario) {
    window.location.href = "/src/views/login.html"
}

// Navbar
document.getElementById("nombreUsuario").textContent = usuario.nombre
document.getElementById("contadorCarrito").textContent = JSON.parse(localStorage.getItem("carrito") || "[]").length

// Info cuenta
document.getElementById("infoNombre").textContent = usuario.nombre
document.getElementById("infoEmail").textContent = usuario.email
document.getElementById("infoRol").textContent = usuario.rol

// Dropdown perfil
document.getElementById("btnPerfil").addEventListener("click", function() {
    document.getElementById("perfilDropdown").classList.toggle("activo")
})

document.getElementById("btnCerrarSesion").addEventListener("click", function() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "/src/views/login.html"
})

document.getElementById("btnCambiarCuenta").addEventListener("click", function() {
    const cuentas = JSON.parse(localStorage.getItem("cuentasGuardadas") || "[]")
    const lista = document.getElementById("listaCuentasModal")
    lista.innerHTML = cuentas.map((c, i) => `
        <div class="cuenta-modal-item" onclick="seleccionarCuentaModal(${i})">
            <div class="cuenta-modal-nombre">${c.nombre}</div>
            <div class="cuenta-modal-email">${c.email}</div>
        </div>
    `).join("") || "<p style='color:#888'>No hay cuentas guardadas</p>"
    document.getElementById("modalCuentas").classList.add("activo")
})

document.getElementById("btnCancelarCuentas").addEventListener("click", function() {
    document.getElementById("modalCuentas").classList.remove("activo")
})

// Navbar scroll
window.addEventListener("scroll", function() {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 20)
})

function mostrarToast(mensaje, error = false) {
    let toast = document.getElementById("toast")
    if (!toast) {
        toast = document.createElement("div")
        toast.id = "toast"
        document.body.appendChild(toast)
    }
    toast.textContent = mensaje
    toast.className = "toast activo"
    toast.style.background = error ? "#ef4444" : "#22c55e"
    setTimeout(function() { toast.classList.remove("activo") }, 3000)
}

async function cambiarNombre() {
    const nuevoNombre = document.getElementById("nuevoNombre").value.trim()
    if (!nuevoNombre) {
        mostrarToast("Escribe un nombre", true)
        return
    }

    const respuesta = await fetch(API + "/auth/cambiar-nombre", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ nombre: nuevoNombre })
    })

    const datos = await respuesta.json()
    if (respuesta.ok) {
        usuario.nombre = nuevoNombre
        localStorage.setItem("usuario", JSON.stringify(usuario))
        document.getElementById("infoNombre").textContent = nuevoNombre
        document.getElementById("nombreUsuario").textContent = nuevoNombre
        document.getElementById("nuevoNombre").value = ""
        mostrarToast("✓ Nombre actualizado")
    } else {
        mostrarToast(datos.error, true)
    }
}

async function cambiarPassword() {
    const passwordActual = document.getElementById("passwordActual").value
    const passwordNueva = document.getElementById("passwordNueva").value
    const passwordConfirmar = document.getElementById("passwordConfirmar").value

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        mostrarToast("Completa todos los campos", true)
        return
    }

    if (passwordNueva !== passwordConfirmar) {
        mostrarToast("Las contraseñas no coinciden", true)
        return
    }

    if (passwordNueva.length < 6) {
        mostrarToast("La contraseña debe tener al menos 6 caracteres", true)
        return
    }

    const respuesta = await fetch(API + "/auth/cambiar-password", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "authorization": token
        },
        body: JSON.stringify({ passwordActual, passwordNueva })
    })

    const datos = await respuesta.json()
    if (respuesta.ok) {
        document.getElementById("passwordActual").value = ""
        document.getElementById("passwordNueva").value = ""
        document.getElementById("passwordConfirmar").value = ""
        mostrarToast("✓ Contraseña actualizada")
    } else {
        mostrarToast(datos.error, true)
    }
}

function cerrarSesion() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "/src/views/login.html"
}