const BASE_URL = 'http://localhost:3001';
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
    // Cập nhật giỏ hàng
    updateCartCount();

        // Xử lý gửi form liên hệ
    const form = document.getElementById("contact-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Ngừng reload trang khi submit

        // Lấy dữ liệu từ form
        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const phoneNumber = document.getElementById("phoneNumber").value;
        const message = document.getElementById("message").value;

        const contactData = {
            fullName,
            email,
            phoneNumber,
            message
        };

        // Gửi yêu cầu POST đến backend
        try {
            const response = await fetch(`${BASE_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
            });

            const result = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Thông tin đã được gửi thành công!',
                    confirmButtonColor: '#fb811e'
                });
                form.reset();
            } else {
                const errorMessage = result?.message || 'Có lỗi xảy ra! Vui lòng thử lại.';
                Swal.fire({
                    icon: 'error',
                    title: 'Thất bại!',
                    text: errorMessage,
                    confirmButtonColor: '#fb811e'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối!',
                text: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
                confirmButtonColor: '#fb811e'
            });
        }
    });
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
