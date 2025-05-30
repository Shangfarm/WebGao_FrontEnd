document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const profileForm = document.querySelector(".profile-form");

    // Ẩn form lúc đầu
    profileForm.style.display = "none";

    if (!token) {
        showToast("Bạn chưa đăng nhập!", "warning");
        window.location.href = "/pages/DangNhap/DangNhap.html";
        return;
    }


    try {
        const res = await fetch("http://localhost:3001/api/users/me", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Token hết hạn hoặc không hợp lệ");

        const data = await res.json();

        // Hiện form nếu token hợp lệ
        profileForm.style.display = "block";

        // Gán thông tin người dùng
        document.getElementById("fullname").value = data.fullName || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phoneNumber").value = data.phoneNumber || "";
        document.getElementById("avatar-preview").src = data.avatar || "";
    } catch (err) {
        console.error("Lỗi xác thực:", err);
        showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
        localStorage.removeItem("token");
        window.location.href = "/pages/DangNhap/DangNhap.html";
        return;
    }

    // Preview ảnh
    let avatarBase64 = "";
    document.getElementById("avatar").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            avatarBase64 = event.target.result;
            document.getElementById("avatar-preview").src = avatarBase64;
        };
        reader.readAsDataURL(file);
    });

    // Submit cập nhật
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullname").value;
        const email = document.getElementById("email").value;
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const avatar = avatarBase64 || document.getElementById("avatar-preview").src;

        try {
            const res = await fetch("http://localhost:3001/api/users/update-me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ fullName, email, phoneNumber, avatar })
            });

            const result = await res.json();

            if (res.ok) {
                showToast("✅ Cập nhật thành công!", "success");
            } else {
                showToast("❌ Cập nhật thất bại: " + result.message, "error");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            showToast("❌ Đã xảy ra lỗi khi gửi yêu cầu cập nhật", "error");
        }
    });

    // Xử lý đăng xuất
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
});
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

function showToast(message, type = "info") {
    let bg = "#198754"; // xanh lá
    if (type === "error") bg = "#dc3545";
    if (type === "warning") bg = "#ffc107";
    if (type === "success") bg = "#28a745";
    Toastify({
        text: message,
        duration: 2000,
        close: true,
        gravity: "top",
        position: "right",
        style: { background: bg, color: "#fff" }
    }).showToast();
}
