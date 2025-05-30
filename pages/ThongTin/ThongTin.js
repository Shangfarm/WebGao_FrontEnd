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
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.clear();

            const toast = document.getElementById("logout-toast");
            if (toast) {
                toast.classList.add("show");
                setTimeout(() => {
                    toast.classList.remove("show");
                    setTimeout(() => {
                        toast.style.display = "none";
                        location.reload();
                    }, 500);
                }, 2000);
            }
        });
    }
}
// Cập nhật số lượng sản phẩm trong giỏ hàng
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = "inline-block";
    } else {
        cartCountEl.style.display = "none";
    }
}

// ---------------- Tìm kiếm -----------------------
// Gọi khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    const searchToggle = document.querySelector(".search-toggle");
    const searchBox = document.getElementById("search-box");

    if (searchToggle && searchBox) {
        searchToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        searchBox.classList.toggle("d-none");
        });

        document.addEventListener("click", function (e) {
        if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
            searchBox.classList.add("d-none");
        }
        });
    }
});
document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault(); // Không reload
    const keyword = document.getElementById("search-input").value.trim();

    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});
//--------Ẩn khi chưa dang nhập hoặc không phải admin-----
document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    const adminOnlyMenus = [
        "menu-discount",
        "menu-stats",
        "menu-shipping",
        "menu-user",
        "menu-order"
    ];

    // Ẩn nếu chưa đăng nhập hoặc không phải admin
    if (!token || role !== "admin") {
        adminOnlyMenus.forEach(id => {
        const item = document.getElementById(id);
        if (item) item.style.display = "none";
        });
    }
});