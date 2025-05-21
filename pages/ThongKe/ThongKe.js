const API_BASE = "http://localhost:3001/api";

async function fetchData(endpoint) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API ${response.status}: ${errorText}`);
    }

    return await response.json();
}

async function loadDashboard() {
    try {
        const [ordersRes, productsRes, usersRes, orderItemsRes, stockStatsRes, categoriesRes] = await Promise.all([
            fetchData("/orders"),
            fetchData("/products?limit=1000"),
            fetchData("/users"),
            fetchData("/order-items/top-selling-products"),
            fetchData("/products/category"),
            fetchData("/categories?limit=1000")  // ✅ thêm dòng này
        ]);

        const orders = ordersRes.data || ordersRes || [];
        const products = productsRes.data || productsRes || [];
        const users = usersRes.data || usersRes || [];
        const orderItems = orderItemsRes;
        const stockStats = stockStatsRes.data || stockStatsRes || [];
        const categories = categoriesRes.data || [];
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat._id] = cat.name;
        });

        document.querySelector("#items-sales span").textContent = orderItems.totalSales || 0;
        document.querySelector("#new-orders span").textContent = orders.length;
        document.querySelector("#total-products span").textContent = products.length;
        document.querySelector("#new-visitors span").textContent = users.length;

        // Biểu đồ sản phẩm bán chạy
        const ctx = document.getElementById("salesChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: orderItems.data.map((item) => item.productName),
                datasets: [{
                    label: "Số lượng đã bán",
                    data: orderItems.data.map((item) => item.quantity),
                    backgroundColor: "rgba(0, 196, 179, 0.6)",
                    borderColor: "#00c4b3",
                    borderWidth: 1,
                }],
            },
            options: {
                scales: {
                y: { beginAtZero: true },
                },
            },
        });

        // Biểu đồ tồn kho theo danh mục
        console.log("Dữ liệu tồn kho theo danh mục:", stockStats);

        const ctxStock = document.getElementById("stockChart").getContext("2d");
        new Chart(ctxStock, {
            type: "pie",
            data: {
                labels: stockStats.map(item => item.categoryName),
                datasets: [{
                    label: "Tồn kho theo danh mục",
                    data: stockStats.map(item => item.totalProducts),
                    backgroundColor: [
                        "#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
                    ],
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 20
                        },
                        formatter: (value) => value,
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });

        // Đơn hàng gần đây
        const salesTable = document.getElementById("sales-table-body");
        (orders.slice ? orders.slice(0, 5) : []).forEach((order) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.customerName || "Không rõ"}</td>
                <td>${order.total ? `$${order.total}` : "0"}</td>
                <td>${new Date(order.createdAt).toLocaleString("vi-VN")}</td>
            `;
            salesTable.appendChild(row);
        });

        // Danh sách tài khoản người dùng
        const userTable = document.getElementById("user-table-body");
        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.fullName || "Không rõ"}</td>
                <td>${user.email || "Không có"}</td>
                <td>${user.role}</td>
                <td>${new Date(user.createdAt).toLocaleString("vi-VN")}</td>
            `;
            userTable.appendChild(row);
        });
        // Danh sách sản phẩm
        const productTableBody = document.getElementById("product-table-body");

        // Sắp xếp theo tên danh mục
        const sortedProducts = [...products].sort((a, b) => {
            const categoryA = categoryMap[a.categoryId] || "";
            const categoryB = categoryMap[b.categoryId] || "";
            return categoryA.localeCompare(categoryB);
        });

        // Hiển thị sản phẩm theo nhóm danh mục
        sortedProducts.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name || "Không rõ"}</td>
                <td>${item.stock ?? 0}</td>
                <td>${categoryMap[item.categoryId] || "Không có"}</td>
            `;
            productTableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Lỗi khi tải dashboard:", err);
    }
}
// Đăng xuất nếu đã đăng nhập
const loginLink = document.getElementById("login-link");
if (loginLink) {
    const token = localStorage.getItem("token");
    if (token) {
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
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
loadDashboard();
