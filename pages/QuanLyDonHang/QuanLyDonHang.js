const token = localStorage.getItem("token");

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

async function fetchOrders() {
  try {
    const res = await fetch("http://localhost:3001/api/orders", {
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
        <td>${isPaid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}</td>
        <td>${order.orderStatus}</td>
        <td>
          ${isCash && !isPaid
            ? `<button class="btn btn-sm btn-success" onclick="markAsPaid('${order._id}')">Xác nhận đã thanh toán</button>`
            : `<span class="text-muted">✔</span>`
          }
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng:", err);
    alert("Lỗi khi tải danh sách đơn hàng");
  }
}

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
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/payment-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (!res.ok) throw new Error("Không thể cập nhật trạng thái");

      await fetchOrders(); // refresh lại
      Swal.fire("✅ Đã cập nhật!", "Đơn hàng đã được đánh dấu là ĐÃ THANH TOÁN.", "success");
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật:", err);
    Swal.fire("Lỗi", "Không thể cập nhật trạng thái thanh toán", "error");
  }
}

document.addEventListener("DOMContentLoaded", fetchOrders);

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