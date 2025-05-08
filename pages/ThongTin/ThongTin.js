document.addEventListener("DOMContentLoaded", function () {
    let counters = document.querySelectorAll(".timer");
    let speed = 200; // Điều chỉnh tốc độ tăng số

    counters.forEach((counter) => {
    let target = +counter.getAttribute("data-to"); // Chuyển data-to thành số
    let count = 0; // Bắt đầu từ 0
    let increment = Math.ceil(target / speed); // Chia nhỏ số lần tăng

    let updateCount = () => {
        if (count < target) {
            count += increment;
            if (count > target) count = target;
            counter.innerText = count.toLocaleString();
            setTimeout(updateCount, 30);
        } else {
            counter.innerText = target.toLocaleString();
        }
    };

    updateCount();
    });
});
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