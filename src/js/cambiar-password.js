console.log("cambiar-password.js cargado") 
const API = "https://mi-servidor-2mff.onrender.com"

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
        z-index: 9999; opacity: 1;
        transform: translateY(0);
        transition: all 0.3s ease;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    `
    setTimeout(function() {
        toast.style.opacity = "0"
    }, 3000)
}

document.getElementById("cambiarForm").addEventListener("submit", async function(e) {
    e.preventDefault()

    const passwordActual = document.querySelector('input[name="passwordActual"]').value
    const passwordNueva = document.querySelector('input[name="passwordNueva"]').value
    const confirmar = document.querySelector('input[name="confirmar"]').value

    if (passwordNueva !== confirmar) {
        mostrarToast("Las contraseñas nuevas no coinciden", true)
        return
    }

    const token = localStorage.getItem("token")

    try {
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
            mostrarToast("✓ Contraseña cambiada correctamente")
            setTimeout(function() {
                window.location.href = "/src/views/index.html"
            }, 1500)
        } else {
            mostrarToast(datos.error, true)
        }
    } catch (error) {
        mostrarToast("Error al conectar con el servidor", true)
    }
})