const API = "https://mi-servidor-2mff.onrender.com"

document.getElementById("adminLoginForm").addEventListener("submit", async function(e) {
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
            if (datos.usuario.rol !== "admin") {
                alert("No tienes permisos de administrador")
                return
            }
            localStorage.setItem("token", datos.token)
            localStorage.setItem("usuario", JSON.stringify(datos.usuario))
            window.location.href = "admin-panel.html"
        } else {
            alert(datos.error)
        }
    } catch (error) {
        alert("Error al conectar con el servidor")
    }
})