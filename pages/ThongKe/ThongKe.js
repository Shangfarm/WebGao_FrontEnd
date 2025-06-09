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
            fetchData("/categories?limit=1000"),
            fetchData("/order-items/total-sold") // ✅ Thêm API tổng sản phẩm đã bán
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

        const totalSoldRes = await fetchData("/order-items/total-sold");
        document.querySelector("#items-sales span").textContent = totalSoldRes.total || 0;
        const newOrders = orders.filter(order => order.orderStatus === "PENDING" && !order.deletedAt);
        document.querySelector("#new-orders span").textContent = newOrders.length;
        document.querySelector("#total-products span").textContent = products.length;
        document.querySelector("#new-visitors span").textContent = users.length;
        const confirmedOrders = orders.filter(order => order.orderStatus === "CONFIRMED" && !order.deletedAt);
        document.querySelector("#confirmed-orders span").textContent = confirmedOrders.length;
        const cancelledOrders = orders.filter(order => order.orderStatus === "CANCELLED" && !order.deletedAt);
        document.querySelector("#cancelled-orders span").textContent = cancelledOrders.length;


        // Biểu đồ sản phẩm đã bán
        const ctx = document.getElementById("salesChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: orderItems.data.map(item => item.productName),
                datasets: [{
                    label: "Số lượng đã bán",
                    data: orderItems.data.map(item => item.totalQuantity),
                    backgroundColor: "rgba(0, 196, 179, 0.7)",
                    borderColor: "#00c4b3",
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        anchor: 'end',
                        align: 'top',
                        formatter: value => value
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Đã bán: ${context.parsed.y}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...orderItems.data.map(item => item.quantity)) + 1,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Số lượng'
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 40
                    }
                }
            }
        });

        // Biểu đồ tồn kho theo danh mục
        const filteredProducts = products.filter(p => p.stock > 0);

        // Gom nhóm số lượng tồn kho theo categoryId
        const grouped = {};
        filteredProducts.forEach(p => {
            const category = categoryMap[p.categoryId] || "Không xác định";
            if (!grouped[category]) grouped[category] = 0;
            grouped[category] += p.stock;
        });

        // Chuyển sang mảng để vẽ biểu đồ
        const stockLabels = Object.keys(grouped);
        const stockData = Object.values(grouped);

        // Biểu đồ tồn kho theo danh mục chính xác
        const ctxStock = document.getElementById("stockChart").getContext("2d");
        new Chart(ctxStock, {
            type: "pie",
            data: {
                labels: stockLabels,
                datasets: [{
                    label: "Tồn kho theo danh mục",
                    data: stockData,
                }],
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
        (orders || []).forEach((order) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.userName || "Không rõ"}</td>
                <td>${order.totalAmount ? `${order.totalAmount.toLocaleString("vi-VN")} đ` : "0"}</td>
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
// <!-- Tùy chọn hiện/ẩn biểu đồ theo lựa chọn -->
document.addEventListener("DOMContentLoaded", () => {
    const chartSelector = document.getElementById("chartSelector");
    const sections = ["sales-chart", "stock-chart", "product-table", "sales-table", "user-table"];

    function updateVisibleSection(selectedId) {
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = (selectedId === "all" || selectedId === id) ? "block" : "none";
            }
        });
    }

    if (chartSelector) {
        chartSelector.addEventListener("change", (e) => {
            updateVisibleSection(e.target.value);
        });

        // Mặc định hiển thị tất cả
        updateVisibleSection("all");
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

// Thống kê doanh thu
async function fetchRevenueStats() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/orders/revenue-stats?groupBy=month", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Invalid response");
    const result = await res.json();
    const data = result.data;
    // Render biểu đồ
    renderRevenueChart(data); 
    } catch (err) {
        console.error("❌ Lỗi khi lấy thống kê doanh thu:", err);
        showToast("Lỗi khi lấy thống kê doanh thu", "error");
    }
}

// Gọi khi trang load
document.addEventListener("DOMContentLoaded", () => {
    fetchRevenueStats();
});

function renderRevenueChart(data) {
    const ctx = document.getElementById("revenueChart")?.getContext("2d");
    if (!ctx) return;

        // Tính tổng doanh thu từ tất cả các tháng
    const totalRevenue = data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);

    // Hiển thị tổng doanh thu lên HTML
    const totalRevenueEl = document.querySelector("#total-revenue span");
    if (totalRevenueEl) {
        totalRevenueEl.textContent = totalRevenue.toLocaleString("vi-VN") + " đ";
    }

    // Tạo mảng 12 tháng mặc định (thay đổi format thành MM-YYYY)
    const months = Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return `${month}-2025`; // 👉 Định dạng lại
    });

    const revenueMap = data.reduce((acc, item) => {
        const [year, month] = item._id.split("-");
        acc[`${month}-${year}`] = item.totalRevenue;
        return acc;
    }, {});

    const values = months.map(m => revenueMap[m] || 0);

    new Chart(ctx, {
        type: "line",
        data: {
            labels: months,
            datasets: [{
                label: "Doanh thu theo tháng (VNĐ)",
                data: values,
                borderColor: "#00c4b3",
                backgroundColor: "rgba(0, 196, 179, 0.2)",
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    align: 'top',
                    anchor: 'end',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: value => value ? value.toLocaleString("vi-VN") + " đ" : ''
                },
                legend: {
                    display: true,
                    position: 'top',   // mặc định là top vẫn OK
                    align: 'end',      // ✅ Căn phải
                    labels: {
                        boxWidth: 20,
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.parsed.y.toLocaleString("vi-VN")} đ`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => value.toLocaleString("vi-VN") + " đ"
                    },
                    title: {
                        display: true,
                        text: "Tổng doanh thu"
                    }
                },
                x: {
                    title: {
                        display: false,
                        text: "Tháng"
                    }
                }
            }
        }
    });
}


function showToast(message, type = "info") {
    alert(message); // hoặc dùng toast riêng nếu đã có
}
