const btnDarkModeAdmin = document.getElementById("btnDarkModeAdmin")

if (localStorage.getItem("darkmode-admin") === "true") {
    document.body.classList.add("dark")
    btnDarkModeAdmin.textContent = "☀️"
}

btnDarkModeAdmin.addEventListener("click", function() {
    document.body.classList.toggle("dark")
    const isDark = document.body.classList.contains("dark")
    localStorage.setItem("darkmode-admin", isDark)
    btnDarkModeAdmin.textContent = isDark ? "☀️" : "🌙"
})