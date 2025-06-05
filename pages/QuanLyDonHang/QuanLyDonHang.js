const API_BASE = "http://localhost:3001";
const token = localStorage.getItem("token");

// Hàm gọi API chung
async function fetchData(endpoint) {
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
// Hàm hiển thị thông báo thanh toán
function getShortPaymentStatus(status) {
    switch (status) {
        case "PAID":
            return "✅ Đã";
        case "PENDING":
            return "⏳ Chờ";
        case "FAILED":
            return "❌ Lỗi";
        default:
            return "–";
    }
}

// Lấy danh sách đơn hàng
async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { data: orders } = await res.json();
        const tbody = document.getElementById("order-body");
        tbody.innerHTML = "";

        orders.forEach((order) => {
            const tr = document.createElement("tr");

            const isCash = order.paymentMethod === "COD";
            const isPaid = order.paymentStatus === "PAID";

            tr.innerHTML = `
                <td>${order._id}</td>
                <td>${order.userName}</td>
                <td>${new Date(order.createdAt).toLocaleString()}</td>
                <td>${order.paymentMethod}</td>
                <td>${getShortPaymentStatus(order.paymentStatus)}</td>
                <td>${order.orderStatus}</td>
                <td>
                    ${isCash && !isPaid
                        ? `<button class="btn btn-sm btn-success" onclick="markAsPaid('${order._id}')">Đã thanh toán</button>`
                        : `<span class="text-muted">✔</span>`}
                </td>
                <td>
                    ${order.orderStatus === "PENDING"
                        ? `<button class="btn btn-sm btn-primary" onclick="markAsConfirmed('${order._id}')">Xác nhận đơn</button>`
                        : `<span class="text-muted">✔</span>`}
                </td>
                <td>
                    ${["CONFIRMED", "SHIPPING"].includes(order.orderStatus)
                        ? `<button class="btn btn-sm btn-danger" onclick="cancelOrder('${order._id}')">Huỷ đơn</button>`
                        : `<span class="text-muted">–</span>`}
                </td>
            `;

            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
        alert("Lỗi khi tải danh sách đơn hàng");
    }
}

// Đánh dấu đã thanh toán
async function markAsPaid(orderId) {
    try {
        const confirm = await Swal.fire({
            icon: "question",
            title: "Xác nhận thanh toán?",
            text: "Bạn chắc chắn muốn đánh dấu đơn hàng này là đã thanh toán?",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Huỷ",
        });

        if (confirm.isConfirmed) {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/payment-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "PAID" }),
            });

            if (!res.ok) throw new Error("Không thể cập nhật trạng thái");

            await fetchOrders();
            Swal.fire("✅ Đã cập nhật!", "Đơn hàng đã được đánh dấu là ĐÃ THANH TOÁN.", "success");
        }
    } catch (err) {
        console.error("Lỗi khi cập nhật:", err);
        Swal.fire("Lỗi", "Không thể cập nhật trạng thái thanh toán", "error");
    }
}

async function markAsConfirmed(orderId) {
    try {
            // 🔍 Lấy thông tin chi tiết đơn hàng
            const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Không thể lấy thông tin đơn hàng");

        const { data: order } = await res.json();

        //Ràng buộc: Nếu là COD mà chưa thanh toán thì không cho xác nhận
        if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
            Swal.fire({
                icon: "warning",
                title: "Không thể xác nhận đơn hàng",
                text: "Đơn hàng thanh toán COD chưa được xác nhận thanh toán!",
                confirmButtonColor: "#fb811e"
            });
            return;
        }

        //Xác nhận đơn nếu đủ điều kiện
        const result = await Swal.fire({
            title: "Xác nhận đơn hàng?",
            text: "Bạn có chắc muốn xác nhận đơn này không?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Huỷ"
        });

        if (result.isConfirmed) {
            const updateRes = await fetch(`${API_BASE}/api/orders/${orderId}/order-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ orderStatus: "CONFIRMED" })
            });

            if (!updateRes.ok) throw new Error("Không thể cập nhật trạng thái đơn hàng");

            await fetchOrders();
            Swal.fire("✅ Thành công", "Đơn hàng đã được xác nhận", "success");
        }
    } catch (err) {
        console.error("Lỗi khi xác nhận đơn:", err);
        Swal.fire("Lỗi", "Không thể cập nhật trạng thái đơn hàng", "error");
    }
}

// Huỷ đơn hàng
async function cancelOrder(orderId) {
    const confirm = await Swal.fire({
        title: "Huỷ đơn hàng?",
        text: "Bạn có chắc muốn huỷ đơn hàng này không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Huỷ đơn",
        cancelButtonText: "Không"
    });

    if (confirm.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderStatus: "CANCELLED" })
            });

            if (!res.ok) throw new Error("Không thể huỷ đơn hàng");

            await fetchOrders();
            Swal.fire("✅ Đã huỷ", "Đơn hàng đã được huỷ thành công.", "success");
        } catch (err) {
            console.error("Lỗi khi huỷ đơn hàng:", err);
            Swal.fire("Lỗi", "Không thể huỷ đơn hàng", "error");
        }
    }
}

// Khởi động khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    fetchOrders();

    const role = localStorage.getItem("role");

    const adminOnlyMenus = [
        "menu-discount",
        "menu-stats",
        "menu-shipping",
        "menu-user",
        "menu-order" // ✅ Sửa lại đúng ID dùng trong HTML
    ];

    if (!token || role !== "admin") {
        adminOnlyMenus.forEach(id => {
            const item = document.getElementById(id);
            if (item) item.style.display = "none";
        });
    }
});

// Quản lý đơn hàng với tìm kiếm và lọc
let currentSearchKeyword = "";
let currentFilterStatus = "ALL"; // Hoặc 'PENDING' hoặc 'CONFIRMED'

function filterAndRenderOrders(orders) {
    const tbody = document.getElementById("order-body");
    tbody.innerHTML = "";

    const keyword = currentSearchKeyword.toLowerCase();
    const statusFilter = currentFilterStatus;

    const filtered = orders.filter(order => {
        const matchesKeyword =
            order.userName?.toLowerCase().includes(keyword) ||
            order._id?.toLowerCase().includes(keyword);
        const matchesStatus =
            statusFilter === "ALL" || order.orderStatus === statusFilter;

        return matchesKeyword && matchesStatus;
    });

    filtered.forEach((order) => {
        const tr = document.createElement("tr");

        const isCash = order.paymentMethod === "COD";
        const isPaid = order.paymentStatus === "PAID";

        tr.innerHTML = `
            <td>${order._id}</td>
            <td>${order.userName}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td>
            <td>${order.paymentMethod}</td>
            <td>${getShortPaymentStatus(order.paymentStatus)}</td>
            <td>${order.orderStatus}</td>
            <td>
                ${isCash && !isPaid
                    ? `<button class="btn btn-sm btn-success" onclick="markAsPaid('${order._id}')">Đã thanh toán</button>`
                    : `<span class="text-muted">✔</span>`}
            </td>
            <td>
                ${order.orderStatus === "PENDING"
                    ? `<button class="btn btn-sm btn-primary" onclick="markAsConfirmed('${order._id}')">Xác nhận đơn</button>`
                    : `<span class="text-muted">✔</span>`}
            </td>
            <td>
                ${["CONFIRMED", "SHIPPING"].includes(order.orderStatus)
                    ? `<button class="btn btn-sm btn-danger" onclick="cancelOrder('${order._id}')">Huỷ</button>`
                    : `<span class="text-muted">–</span>`}
            </td>

        `;

        tbody.appendChild(tr);
    });
}

let allOrdersCache = [];

async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { data: orders } = await res.json();
        allOrdersCache = orders;
        filterAndRenderOrders(allOrdersCache); // Gọi render có lọc

    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
        alert("Lỗi khi tải danh sách đơn hàng");
    }
}

//Bắt sự kiện tìm kiếm
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-order");
    const filterSelect = document.getElementById("filter-status");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearchKeyword = e.target.value;
            filterAndRenderOrders(allOrdersCache);
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener("change", (e) => {
            currentFilterStatus = e.target.value;
            filterAndRenderOrders(allOrdersCache);
        });
    }
});

