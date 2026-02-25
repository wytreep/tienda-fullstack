const btnDarkModeLogin = document.getElementById("btnDarkModeLogin")

if (localStorage.getItem("darkmode-login") === "true") {
    document.body.classList.add("light")
    btnDarkModeLogin.textContent = "🌙"
} else {
    btnDarkModeLogin.textContent = "☀️"
}

btnDarkModeLogin.addEventListener("click", function() {
    document.body.classList.toggle("light")
    const isLight = document.body.classList.contains("light")
    localStorage.setItem("darkmode-login", isLight)
    btnDarkModeLogin.textContent = isLight ? "🌙" : "☀️"
})