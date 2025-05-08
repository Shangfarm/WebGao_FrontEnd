const loginLink = document.getElementById("login-link");
if (loginLink) {
    const token = localStorage.getItem("token");
    if (token) {
        // Nếu đã đăng nhập → đổi thành ĐĂNG XUẤT
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("Bạn đã đăng xuất thành công!");
            location.reload(); // Reload trang
        });
    }
}