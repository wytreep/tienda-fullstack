const API = "http://localhost:3000/productos"

const productForm = document.getElementById('productForm')
const productNameInput = document.getElementById('productName')
const productPriceInput = document.getElementById('productPrice')
const productStockInput = document.getElementById('productStock')
const productTableBody = document.getElementById('productTableBody')
const emptyMessage = document.getElementById('emptyMessage')

// Cargar productos desde la API
async function cargarProductos() {
    const respuesta = await fetch(API)
    const productos = await respuesta.json()
    renderTabla(productos)
}

// Renderizar tabla
function renderTabla(productos) {
    productTableBody.innerHTML = ""

    if (productos.length === 0) {
        emptyMessage.style.display = "block"
        return
    }

    emptyMessage.style.display = "none"

    productos.forEach(function(producto, index) {
        const fila = document.createElement("tr")
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td>${producto.stock}</td>
            <td>
                <button class="btn-delete" onclick="eliminarProducto(${producto.id})">Eliminar</button>
            </td>
        `
        productTableBody.appendChild(fila)
    })
}

// Agregar producto
productForm.addEventListener("submit", async function(e) {
    e.preventDefault()

    const nombre = productNameInput.value.trim()
    const precio = parseFloat(productPriceInput.value)
    const stock = parseInt(productStockInput.value)

    if (nombre === "" || precio <= 0 || stock < 0) {
        alert("Por favor ingrese valores válidos")
        return
    }

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, stock })
    })

    productForm.reset()
    cargarProductos()
})

// Eliminar producto
async function eliminarProducto(id) {
    if (confirm("¿Seguro que desea eliminar este producto?")) {
        await fetch(API + "/" + id, { method: "DELETE" })
        cargarProductos()
    }
}

// Cargar al iniciar
document.addEventListener("DOMContentLoaded", cargarProductos)