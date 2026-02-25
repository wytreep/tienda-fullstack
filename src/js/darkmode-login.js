const btnDarkModeLogin = document.getElementById("btnDarkModeLogin")

if (localStorage.getItem("darkmode-login") === "true") {
    document.body.classList.add("dark")
    btnDarkModeLogin.textContent = "☀️"
}

btnDarkModeLogin.addEventListener("click", function() {
    document.body.classList.toggle("dark")
    const isDark = document.body.classList.contains("dark")
    localStorage.setItem("darkmode-login", isDark)
    btnDarkModeLogin.textContent = isDark ? "☀️" : "🌙"
})