const API = "http://localhost:3000"

document.getElementById("cambiarForm").addEventListener("submit", async function(e) {
    e.preventDefault()

    const passwordActual = document.querySelector('input[name="passwordActual"]').value
    const passwordNueva = document.querySelector('input[name="passwordNueva"]').value
    const confirmar = document.querySelector('input[name="confirmar"]').value

    if (passwordNueva !== confirmar) {
        alert("Las contraseñas nuevas no coinciden")
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
            alert("Contraseña cambiada correctamente")
            window.location.href = "/src/views/index.html"
        } else {
            alert(datos.error)
        }
    } catch (error) {
        alert("Error al conectar con el servidor")
    }
})