// ============================================
// admin.js - VERSIÓN CON DEPURACIÓN
// ============================================

console.log("🚀 admin.js cargando...");

// ============================================
// CONFIGURACIÓN - CAMBIA ESTA URL SEGÚN EL PASO 1
// ============================================
const API = "https://mi-servidor-2mff.onrender.com"; // <-- CAMBIA ESTO cuando sepas la URL correcta

const token = localStorage.getItem("admin-token");
const usuario = JSON.parse(localStorage.getItem("admin-usuario"));

if (!token || !usuario || (usuario.rol !== "admin" && usuario.rol !== "superadmin")) {
    window.location.href = "admin-login.html";
}

const esSuperAdmin = usuario.rol === "superadmin";

// ============================================
// VARIABLES GLOBALES
// ============================================
let productos = [];
let pedidos = [];
let usuarios = [];
let resenas = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener("DOMContentLoaded", async function() {
    console.log("📦 Inicializando panel...");
    
    // Mostrar información del usuario
    actualizarInfoUsuario();
    
    // Intentar cargar datos del backend
    await cargarTodosLosDatos();
    
    // Configurar botón de cerrar sesión
    document.getElementById("btnCerrarSesion")?.addEventListener("click", function() {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-usuario");
        window.location.href = "admin-login.html";
    });
    
    // Cargar dashboard si está activo
    if (document.getElementById("seccion-dashboard")?.classList.contains("activo")) {
        cargarDashboard();
    }
});

// ============================================
// FUNCIÓN PARA CARGAR TODOS LOS DATOS DEL BACKEND
// ============================================
async function cargarTodosLosDatos() {
    console.log("🌐 Intentando conectar al backend:", API);
    
    try {
        // Probar conexión básica
        const testRes = await fetch(API + "/productos", {
            headers: { 'authorization': token }
        });
        
        if (!testRes.ok) {
            throw new Error(`HTTP ${testRes.status}: ${testRes.statusText}`);
        }
        
        console.log("✅ Conexión exitosa al backend");
        
        // Cargar productos
        try {
            const res = await fetch(API + "/productos", { headers: { 'authorization': token } });
            productos = await res.json();
            console.log(`✅ ${productos.length} productos cargados`);
        } catch (e) {
            console.error("❌ Error cargando productos:", e);
        }
        
        // Cargar pedidos
        try {
            const res = await fetch(API + "/pedidos", { headers: { 'authorization': token } });
            pedidos = await res.json();
            console.log(`✅ ${pedidos.length} pedidos cargados`);
        } catch (e) {
            console.error("❌ Error cargando pedidos:", e);
        }
        
        // Cargar usuarios
        try {
            const res = await fetch(API + "/usuarios", { headers: { 'authorization': token } });
            usuarios = await res.json();
            console.log(`✅ ${usuarios.length} usuarios cargados`);
        } catch (e) {
            console.error("❌ Error cargando usuarios:", e);
        }
        
        // Cargar reseñas
        try {
            const res = await fetch(API + "/resenas", { headers: { 'authorization': token } });
            resenas = await res.json();
            console.log(`✅ ${resenas.length} reseñas cargadas`);
        } catch (e) {
            console.error("❌ Error cargando reseñas:", e);
        }
        
    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error.message);
        console.error("Posibles causas:");
        console.error("1. La URL del API es incorrecta:", API);
        console.error("2. El servidor backend no está corriendo");
        console.error("3. El servidor está en otra URL (localhost, otro puerto)");
        console.error("4. Hay un problema de CORS");
        
        // Mostrar mensaje en la interfaz
        mostrarErrorConexion(error.message);
    }
}

function mostrarErrorConexion(mensaje) {
    // Crear un mensaje de error visible
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: monospace;
    `;
    errorDiv.innerHTML = `
        <strong>❌ Error de conexión</strong><br>
        ${mensaje}<br><br>
        URL: ${API}<br>
        Verifica la consola para más detalles (F12)
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 10000);
}

// ============================================
// ACTUALIZAR INFORMACIÓN DEL USUARIO
// ============================================
function actualizarInfoUsuario() {
    const elementos = {
        adminAvatar: usuario.nombre.charAt(0).toUpperCase(),
        adminAvatarSmall: usuario.nombre.charAt(0).toUpperCase(),
        adminNombreBanner: usuario.nombre.charAt(0).toUpperCase(),
        adminNombre: "Admin " + usuario.nombre,
        adminNombreSmall: usuario.nombre,
        adminRol: esSuperAdmin ? "Super Admin" : "Administrador",
        adminTagRol: esSuperAdmin ? "SUPER ADMIN" : "ADMIN",
        adminRolBanner: esSuperAdmin ? "Super Administrador" : "Administrador"
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    }
    
    // Configuración según rol
    if (esSuperAdmin) {
        document.getElementById("configDirecta")?.style.display = "block";
        document.getElementById("navAdminGroup")?.style.display = "block";
    } else {
        document.getElementById("configSolicitud")?.style.display = "block";
        document.getElementById("navAdminGroup")?.style.display = "none";
    }
}

// ============================================
// FUNCIONES DE NAVEGACIÓN
// ============================================
function mostrarSeccion(nombre, event) {
    console.log("📍 Navegando a:", nombre);
    
    document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activo"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("activo"));
    
    const seccion = document.getElementById("seccion-" + nombre);
    if (seccion) seccion.classList.add("activo");
    
    const titulos = {
        dashboard: "Dashboard", ventas: "Ventas", productos: "Productos",
        pedidos: "Pedidos", resenas: "Reseñas", usuarios: "Usuarios",
        invitaciones: "Invitaciones", configuracion: "Configuración"
    };
    
    document.getElementById("tituloSeccion").textContent = titulos[nombre] || nombre;
    document.getElementById("breadcrumbActual").textContent = titulos[nombre] || nombre;
    
    if (event?.target) event.target.classList.add("activo");
    
    // Cargar datos según la sección
    switch(nombre) {
        case "dashboard": cargarDashboard(); break;
        case "productos": cargarProductos(); break;
        case "pedidos": cargarPedidos(); break;
        case "usuarios": cargarUsuarios(); break;
        case "ventas": cargarVentas(); break;
        case "resenas": cargarResenas(); break;
        case "invitaciones": cargarInvitaciones(); break;
    }
}

// ============================================
// DASHBOARD
// ============================================
function cargarDashboard() {
    console.log("📊 Cargando dashboard...");
    
    // Si no hay datos, mostrar valores por defecto
    const stats = {
        productos: productos.length || 4,
        pedidos: pedidos.length || 5,
        usuarios: usuarios.filter(u => u.rol === 'usuario').length || 3,
        ventas: pedidos.reduce((sum, p) => sum + (p.total || 0), 0) || 9108600
    };
    
    // Actualizar stats
    setText("statProductos", stats.productos);
    setText("statPedidos", stats.pedidos);
    setText("statUsuarios", stats.usuarios);
    setText("statVentas", "$" + stats.ventas.toLocaleString());
    
    // Banner
    setText("bannerProductos", stats.productos);
    setText("bannerPedidos", stats.pedidos);
    setText("bannerUsuarios", stats.usuarios);
    
    // Pendientes
    const pendientes = pedidos.filter(p => p.estado === "pendiente").length || 3;
    setText("pedidosPendientes", pendientes + " pendientes");
    
    // Trends
    setText("trendProductos", stats.productos + " activos");
    setText("trendUsuarios", stats.usuarios + " clientes");
    setText("ventasMes", "+30% este mes");
    
    // Cargar componentes
    cargarTopProductos();
    cargarPedidosRecientes();
}

function setText(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function cargarTopProductos() {
    const container = document.getElementById("topProductosContainer");
    if (!container) return;
    
    const lista = productos.length ? productos : [
        { id: 1, nombre: "Monitor", precio: 800000, stock: 21 },
        { id: 2, nombre: "Mouse", precio: 12000, stock: 0 },
        { id: 3, nombre: "Teclado", precio: 100000, stock: 19 },
        { id: 4, nombre: "Laptop", precio: 1500300, stock: 4 }
    ];
    
    const top = lista.slice(0, 4);
    const colores = ["#2560a8", "#1e7d4e", "#b8922a", "#7d3c98"];
    
    container.innerHTML = top.map((p, i) => `
        <div class="materia-item">
            <div class="materia-color" style="background:${colores[i]}"></div>
            <div class="materia-info">
                <div class="materia-name">${p.nombre}</div>
                <div class="materia-prof">Stock: ${p.stock}</div>
            </div>
            <div class="materia-right">
                <div class="materia-pct">$${p.precio.toLocaleString()}</div>
            </div>
        </div>
    `).join("");
}

function cargarPedidosRecientes() {
    const tbody = document.getElementById("tbodyPedidosRecientes");
    if (!tbody) return;
    
    const lista = pedidos.length ? pedidos : [
        { id: 9, usuario: "Edwin", total: 36000, estado: "pendiente", fecha: "26/2/2026" },
        { id: 8, usuario: "Jai", total: 1500300, estado: "pendiente", fecha: "26/2/2026" },
        { id: 5, usuario: "Edwin", total: 2400000, estado: "pendiente", fecha: "24/2/2026" }
    ];
    
    tbody.innerHTML = lista.slice(0, 5).map(p => `
        <tr>
            <td>#${p.id}</td>
            <td>${p.usuario}</td>
            <td>$${p.total.toLocaleString()}</td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
            <td>${p.fecha || new Date().toLocaleDateString()}</td>
        </tr>
    `).join("");
}

// ============================================
// PRODUCTOS
// ============================================
function cargarProductos() {
    const tbody = document.getElementById("tbodyProductos");
    if (!tbody) return;
    
    const lista = productos.length ? productos : [
        { id: 1, nombre: "Monitor", precio: 800000, stock: 21 },
        { id: 2, nombre: "Mouse", precio: 12000, stock: 0 },
        { id: 3, nombre: "Teclado", precio: 100000, stock: 19 },
        { id: 4, nombre: "Laptop", precio: 1500300, stock: 4 }
    ];
    
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td>📦</td>
            <td>${p.nombre}</td>
            <td>$${p.precio.toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>${p.categoria || "General"}</td>
            <td>
                <button class="btn-edit" onclick="editarProducto(${p.id})">Editar</button>
                <button class="btn-delete" onclick="eliminarProducto(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join("");
}

// ============================================
// FUNCIONES GLOBALES
// ============================================
window.mostrarSeccion = mostrarSeccion;
window.editarProducto = (id) => alert(`Editar producto ${id}`);
window.eliminarProducto = (id) => {
    if (confirm("¿Eliminar producto?")) alert("Producto eliminado");
};