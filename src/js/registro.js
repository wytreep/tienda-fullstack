const API = "http://localhost:3000"

document.getElementById("registroForm").addEventListener("submit", async function(e) {
    e.preventDefault()

    const nombre = document.querySelector('input[name="nombre"]').value
    const email = document.querySelector('input[name="email"]').value
    const password = document.querySelector('input[name="password"]').value

    try {
        const respuesta = await fetch(API + "/auth/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password })
        })

        const datos = await respuesta.json()

        if (respuesta.ok) {
            alert("Usuario registrado correctamente")
            window.location.href = "/src/views/login.html"
        } else {
            alert(datos.error)
        }
    } catch (error) {
        alert("Error al conectar con el servidor")
    }
})