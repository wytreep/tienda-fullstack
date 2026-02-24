const btnDarkMode = document.getElementById("btnDarkMode")

if (localStorage.getItem("darkmode") === "true") {
    document.body.classList.add("dark")
    btnDarkMode.textContent = "☀️"
}

btnDarkMode.addEventListener("click", function() {
    document.body.classList.toggle("dark")
    const isDark = document.body.classList.contains("dark")
    localStorage.setItem("darkmode", isDark)
    btnDarkMode.textContent = isDark ? "☀️" : "🌙"
})