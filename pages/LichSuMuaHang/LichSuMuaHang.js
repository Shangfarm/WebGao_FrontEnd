// Hàm Toastify
function showToast(message, type = "info") {
  let bg = "#198754";
  if (type === "error") bg = "#dc3545";
  if (type === "warning") bg = "#ffc107";
  if (type === "success") bg = "#28a745";

  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: bg,
      color: "#fff",
      borderRadius: "6px"
    }
  }).showToast();
}

// Kiểm tra token
const token = localStorage.getItem("token");
if (!token) {
  showToast("⚠️ Bạn cần đăng nhập để xem lịch sử mua hàng!", "warning");
  alert("Bạn cần đăng nhập để xem lịch sử mua hàng!");
  window.location.href = "/pages/DangNhap/DangNhap.html";
}

// Lấy đơn hàng
async function fetchOrders() {
  try {
    showToast("📦 Đang tải lịch sử mua hàng...", "info");

    const res = await fetch("http://localhost:3001/api/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Không thể lấy dữ liệu");

    const { data: orders } = await res.json();
    const tbody = document.getElementById("orders-body");
    tbody.innerHTML = "";

    if (!orders.length) {
      document.getElementById("no-orders").style.display = "block";
      return;
    }

    document.getElementById("no-orders").style.display = "none";

    orders.forEach(order => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order._id}</td>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td>${order.totalAmount.toLocaleString()} đ</td>
        <td>${order.orderStatus || "PROCESSING"}</td>
        <td>
          <a href="/pages/ThanhToan/ThanhToan.html?orderId=${order._id}" class="btn btn-sm btn-primary">Xem chi tiết</a>
        </td>
      `;
      tbody.appendChild(tr);
    });

    showToast("✅ Tải đơn hàng thành công", "success");
  } catch (err) {
    showToast("❌ Lỗi khi tải đơn hàng", "error");
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", fetchOrders);
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