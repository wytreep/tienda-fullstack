// ===== DASHBOARD =====
let grafVentasChart = null
let grafEstadosChart = null

async function cargarEstadisticas() {
    const r = await fetch(API + "/estadisticas", {
        headers: { "authorization": token }
    })
    const stats = await r.json()

    animarNumero("statProductos", stats.productos)
    animarNumero("statPedidos", stats.pedidos)
    animarNumero("statUsuarios", stats.usuarios)
    document.getElementById("statVentas").textContent = "$" + Number(stats.ventas).toLocaleString()

    document.getElementById("bannerProductos").textContent = stats.productos
    document.getElementById("bannerPedidos").textContent = stats.pedidos
    document.getElementById("bannerUsuarios").textContent = stats.usuarios

    const ahora = new Date()
    document.getElementById("bannerFecha").textContent = ahora.toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    })

    const partes = usuario.nombre.split(" ")
    document.getElementById("bannerNombre").innerHTML = `${partes[0]} <em>${partes[1] || ""}</em>`

    await cargarGraficos()
    await cargarPedidosRecientes()
    await cargarTopProductos()
    await cargarAlertas()
}

function animarNumero(id, fin) {
    const el = document.getElementById(id)
    if (!el) return
    const duracion = 800
    const inicio = Date.now()
    function paso() {
        const progreso = Math.min((Date.now() - inicio) / duracion, 1)
        const val = Math.floor(fin * (1 - Math.pow(1 - progreso, 3)))
        el.textContent = val
        if (progreso < 1) requestAnimationFrame(paso)
        else el.textContent = fin
    }
    requestAnimationFrame(paso)
}

async function cargarGraficos() {
    const r = await fetch(API + "/pedidos", {
        headers: { "authorization": token }
    })
    const pedidos = await r.json()

    // Gráfico ventas por mes
    const meses = {}
    pedidos.forEach(function(p) {
        if (p.estado === "cancelado") return
        const fecha = new Date(p.created_at)
        const key = fecha.toLocaleDateString("es-CO", { month: "short", year: "2-digit" })
        meses[key] = (meses[key] || 0) + Number(p.total)
    })

    const labelsVentas = Object.keys(meses).slice(-6)
    const dataVentas = labelsVentas.map(k => meses[k])

    if (grafVentasChart) grafVentasChart.destroy()
    const ctxV = document.getElementById("grafVentas").getContext("2d")
    const gradiente = ctxV.createLinearGradient(0, 0, 0, 200)
    gradiente.addColorStop(0, "rgba(37,96,168,0.22)")
    gradiente.addColorStop(1, "rgba(37,96,168,0)")

    grafVentasChart = new Chart(ctxV, {
        type: "line",
        data: {
            labels: labelsVentas.length ? labelsVentas : ["Sin datos"],
            datasets: [{
                label: "Ventas",
                data: dataVentas.length ? dataVentas : [0],
                borderColor: "#2560a8",
                backgroundColor: gradiente,
                borderWidth: 2.5,
                pointBackgroundColor: "#2560a8",
                pointRadius: 4,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => " $" + Number(ctx.raw).toLocaleString() } }
            },
            scales: {
                y: {
                    grid: { color: "rgba(0,0,0,0.04)" },
                    ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#94a3b8", callback: v => "$" + Number(v).toLocaleString() }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#94a3b8" }
                }
            }
        }
    })

    // Gráfico dona estados
    const estadoConteo = {}
    const estadoColores = {
        pendiente: "#fbbf24", procesando: "#38bdf8", empacado: "#a78bfa",
        enviado: "#60a5fa", entregado: "#34d399", cancelado: "#f87171"
    }

    pedidos.forEach(p => { estadoConteo[p.estado] = (estadoConteo[p.estado] || 0) + 1 })

    const labelsEstados = Object.keys(estadoConteo)
    const dataEstados = labelsEstados.map(k => estadoConteo[k])
    const coloresEstados = labelsEstados.map(k => estadoColores[k] || "#94a3b8")

    document.getElementById("donaTotalNum").textContent = pedidos.length

    if (grafEstadosChart) grafEstadosChart.destroy()
    const ctxE = document.getElementById("grafEstados").getContext("2d")

    grafEstadosChart = new Chart(ctxE, {
        type: "doughnut",
        data: {
            labels: labelsEstados,
            datasets: [{
                data: dataEstados,
                backgroundColor: coloresEstados,
                borderWidth: 3,
                borderColor: document.body.classList.contains("dark") ? "#0f1c35" : "#fff",
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            cutout: "68%",
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} pedidos` } }
            }
        }
    })

    const leyenda = document.getElementById("donaLeyenda")
    leyenda.innerHTML = labelsEstados.map((estado, i) => `
        <div class="dona-item">
            <div class="dona-dot" style="background:${coloresEstados[i]}"></div>
            ${estado} (${dataEstados[i]})
        </div>
    `).join("")
}

async function cargarPedidosRecientes() {
    const r = await fetch(API + "/pedidos", { headers: { "authorization": token } })
    const pedidos = await r.json()
    const tbody = document.getElementById("tbodyPedidosRecientes")
    const recientes = pedidos.slice(0, 6)

    if (!recientes.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px;font-family:'JetBrains Mono',monospace;font-size:11px">No hay pedidos aún</td></tr>`
        return
    }

    tbody.innerHTML = recientes.map(p => `
        <tr onclick="mostrarSeccion('pedidos', event)" style="cursor:pointer">
            <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gray)">#${p.id}</span></td>
            <td>
                <div style="font-weight:600;font-size:13px">${p.usuario}</div>
            </td>
            <td><span style="font-family:'Libre Baskerville',serif;font-weight:700;color:var(--navy)">$${Number(p.total).toLocaleString()}</span></td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
            <td><span style="font-size:11px;color:var(--gray);font-family:'JetBrains Mono',monospace">${new Date(p.created_at).toLocaleDateString("es-CO")}</span></td>
        </tr>
    `).join("")
}

async function cargarTopProductos() {
    const rProd = await fetch(API + "/productos", { headers: { "authorization": token } })
    const productos = await rProd.json()

    const topData = productos
        .sort((a, b) => b.precio - a.precio)
        .slice(0, 5)

    const contenedor = document.getElementById("topProductos")
    if (!topData.length) {
        contenedor.innerHTML = `<p style="text-align:center;color:var(--gray);font-size:12px;padding:16px;font-family:'JetBrains Mono',monospace">Sin productos</p>`
        return
    }

    const maxVal = Math.max(...topData.map(p => p.precio))
    const colores = ["#2560a8", "#1e7d4e", "#b8922a", "#7d3c98", "#c0392b"]

    contenedor.innerHTML = topData.map((p, i) => {
        const pct = Math.round((p.precio / maxVal) * 100)
        return `
            <div class="top-producto-item" onclick="mostrarSeccion('productos', event)">
                <div class="top-producto-rank">${i + 1}</div>
                <div class="top-producto-info">
                    <div class="top-producto-nombre">${p.nombre}</div>
                    <div class="top-producto-barra-wrap">
                        <div class="top-producto-barra" style="width:${pct}%;background:${colores[i]}"></div>
                    </div>
                </div>
                <div class="top-producto-ventas">$${Number(p.precio).toLocaleString()}</div>
            </div>
        `
    }).join("")
}

async function cargarAlertas() {
    const alertas = []

    const rProd = await fetch(API + "/productos", { headers: { "authorization": token } })
    const productos = await rProd.json()
    const sinStock = productos.filter(p => p.stock === 0)
    const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= 3)

    sinStock.forEach(p => alertas.push({ tipo: "error", texto: `❌ Sin stock: <strong>${p.nombre}</strong>`, seccion: "productos" }))
    stockBajo.forEach(p => alertas.push({ tipo: "warn", texto: `⚠️ Stock bajo: <strong>${p.nombre}</strong> — ${p.stock} uds`, seccion: "productos" }))

    const rPed = await fetch(API + "/pedidos", { headers: { "authorization": token } })
    const pedidos = await rPed.json()

    const canceladosHoy = pedidos.filter(p => {
        return p.estado === "cancelado" && new Date(p.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    })

    const pendientesViejos = pedidos.filter(p => {
        return p.estado === "pendiente" && new Date(p.created_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    })

    if (canceladosHoy.length) alertas.push({ tipo: "error", texto: `❌ ${canceladosHoy.length} pedido(s) cancelado(s) hoy`, seccion: "pedidos" })
    if (pendientesViejos.length) alertas.push({ tipo: "warn", texto: `⏳ ${pendientesViejos.length} pedido(s) pendiente(s) hace más de 2 días`, seccion: "pedidos" })

    const contenedor = document.getElementById("alertasSistema")
    contenedor.innerHTML = alertas.length
        ? alertas.map(a => `<div class="dash-alerta dash-alerta-${a.tipo}" onclick="mostrarSeccion('${a.seccion}', event)">${a.texto}</div>`).join("")
        : `<div class="dash-alerta dash-alerta-ok">✓ Todo en orden, sin alertas pendientes</div>`
}