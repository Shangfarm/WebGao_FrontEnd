const token = localStorage.getItem("token");
if (!token) {
  alert("Bạn cần đăng nhập để xem lịch sử mua hàng!");
  window.location.href = "/pages/DangNhap/DangNhap.html";
}

async function fetchOrders() {
  try {
    const res = await fetch("http://localhost:3001/api/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Không thể lấy lịch sử mua hàng");
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
  } catch (err) {
    alert("Không thể lấy lịch sử đơn hàng");
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", fetchOrders);
