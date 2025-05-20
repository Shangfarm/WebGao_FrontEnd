// Đăng xuất nếu đã đăng nhập
const loginLink = document.getElementById("login-link");
if (loginLink) {
    const token = localStorage.getItem("token");
    if (token) {
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.clear();
        alert("Bạn đã đăng xuất thành công!");
        location.reload();
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

// Gọi khi DOM sẵn sàng
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
    e.preventDefault();
    const keyword = document.getElementById("search-input").value.trim();
    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});

// Ẩn menu admin nếu không phải admin
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

    if (!token || role !== "admin") {
        adminOnlyMenus.forEach(id => {
        const item = document.getElementById(id);
        if (item) item.style.display = "none";
        });
    }
});

// Lấy danh sách yêu thích
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("wishlist-container");
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        container.innerHTML = `<div class="col-12 text-center text-danger"><p>⚠️ Bạn cần đăng nhập để xem danh sách yêu thích.</p></div>`;
        return;
    }

    try {
        const res = await fetch(`http://localhost:3001/api/wishlist/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await res.json();
        const wishlist = result.data;

        if (!wishlist || wishlist.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted"><p>Chưa có sản phẩm nào được yêu thích.</p></div>`;
            return;
        }

        wishlist.forEach(item => {
            const product = item.productId;
            const originalPrice = product.original_price || product.price;
            const discount = product.discount || 0;

            // ✅ Tính giá sau giảm
            const salePrice = discount > 0
                ? Math.round(originalPrice * (1 - discount / 100))
                : originalPrice;

            const discountBadge = discount
                ? `<span class="badge bg-danger ms-2">-${discount}%</span>`
                : "";

            const col = document.createElement("div");
            col.className = "col-md-4 mb-4";
            col.innerHTML = `
                <div class="card shadow-sm h-100">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted">${product.description?.substring(0, 70) || ""}...</p>
                        <div class="mt-auto">
                            <div class="mb-2">
                                <span class="fw-bold text-danger">${salePrice.toLocaleString("vi-VN")} đ</span>
                                ${discount > 0
                                    ? `<span class="text-muted text-decoration-line-through ms-2">${originalPrice.toLocaleString("vi-VN")} đ</span>`
                                    : ""}
                                ${discountBadge}
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <a href="/pages/TTSanPham/TTSanPham.html?id=${product._id}" class="btn btn-sm btn-outline-primary">Xem chi tiết</a>
                                <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${item._id}">🗑️ Gỡ</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });

        // ✅ Xóa từng sản phẩm
        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const wishlistId = button.dataset.id;
                const res = await fetch(`http://localhost:3001/api/wishlist/${wishlistId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    location.reload();
                } else {
                    alert("❌ Không thể xóa sản phẩm khỏi danh sách yêu thích.");
                }
            });
        });

        // ✅ Xóa tất cả (nếu có nút)
        document.getElementById("clear-wishlist-btn")?.addEventListener("click", async () => {
            const confirmDelete = confirm("Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?");
            if (!confirmDelete) return;

            for (let item of wishlist) {
                await fetch(`http://localhost:3001/api/wishlist/${item._id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            location.reload();
        });

    } catch (err) {
        console.error("Lỗi khi lấy danh sách yêu thích:", err);
        container.innerHTML = `<div class="col-12 text-center text-danger"><p>Lỗi khi tải dữ liệu.</p></div>`;
    }
});
