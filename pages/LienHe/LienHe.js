const BASE_URL = 'http://localhost:3001';
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

// Tìm kiếm sản phẩm
document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault(); // Không reload
    const keyword = document.getElementById("search-input").value.trim();

    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});
