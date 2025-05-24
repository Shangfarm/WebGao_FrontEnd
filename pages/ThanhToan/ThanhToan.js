const orderId = new URLSearchParams(window.location.search).get("orderId");
const token = localStorage.getItem("token");

if (!orderId || !token) {
  alert("Thiếu mã đơn hàng hoặc bạn chưa đăng nhập!");
  window.location.href = "/pages/TrangChu/home.html";
}

async function fetchOrderDetails() {
  try {
    const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Không thể lấy thông tin đơn hàng");

    const { data: order } = await res.json();
    console.log("Chi tiết đơn hàng:", order);

    // 👤 Thông tin người nhận
    document.getElementById("userName").textContent = order.userName;
    document.getElementById("phoneNumber").textContent = order.shippingAddress.phoneNumber;
    document.getElementById("address").textContent = `${order.shippingAddress.houseNumber}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`;

    // 📦 Thông tin đơn hàng
    document.getElementById("orderId").textContent = order._id;
    document.getElementById("createdAt").textContent = new Date(order.createdAt).toLocaleString();
    document.getElementById("paymentMethod").textContent = order.paymentMethod;
    document.getElementById("shippingMethod").textContent = `${order.shippingMethodId.name} (${order.shippingMethodId.price.toLocaleString()} đ)`;
    document.getElementById("promotionInfo").textContent = order.promotionId ? `${order.promotionId.name} - ${order.promotionId.discountType === "percentage" ? order.promotionId.discountValue + "%" : order.promotionId.discountValue.toLocaleString() + " đ"}` : "Không áp dụng";
    document.getElementById("couponInfo").textContent = order.couponId ? order.couponId.code : "Không áp dụng";

    // 🧾 Danh sách sản phẩm
// 🧾 Danh sách sản phẩm
const tbody = document.getElementById("items-body");
let productSubtotal = 0;
order.items.forEach(item => {
  const itemTotal = item.price * item.quantity;
  productSubtotal += itemTotal;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.productId?.name || "Không rõ"}</td>
    <td>${item.quantity}</td>
    <td>${item.price.toLocaleString()} đ</td>
    <td>${itemTotal.toLocaleString()} đ</td>
  `;
  tbody.appendChild(row);
});
    // Tổng kết
    const shippingFee = order.shippingMethodId.price || 0;

    // Tính lại tổng tiền từ danh sách sản phẩm
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Tính giảm khuyến mãi
    let promotionDiscount = 0;
    let promotionText = "Không áp dụng";

    const promo = order.promotionId; // Viết tắt cho dễ đọc

    // Chỉ hiện nếu ĐỦ thông tin và tên KHÔNG RỖNG
    if (
      promo &&
      typeof promo.name === "string" &&
      promo.name.trim() !== "" &&
      promo.discountType &&
      typeof promo.discountValue === "number"
    ) {
      if (promo.discountType === "percentage") {
        promotionDiscount = Math.round(order.totalCost * promo.discountValue / 100);
        promotionText = `${promo.name} - ${promo.discountValue}%`;
      } else if (promo.discountType === "fixed") {
        promotionDiscount = promo.discountValue;
        promotionText = `${promo.name} - ${promo.discountValue.toLocaleString()} đ`;
      }
    }

  // Cập nhật giao diện
  document.getElementById("subtotal").textContent = subtotal.toLocaleString() + " đ";
  document.getElementById("promotionInfo").textContent = promotionText;
  document.getElementById("discount").textContent = `- ${promotionDiscount.toLocaleString()} đ`;
  document.getElementById("shippingFee").textContent = shippingFee.toLocaleString() + " đ";
  document.getElementById("totalAmount").textContent = order.totalAmount.toLocaleString() + " đ";

      // Trạng thái
      document.getElementById("orderStatus").textContent = order.orderStatus;
      document.getElementById("shippingStatus").textContent = order.shippingStatus || "PROCESSING";

    } catch (err) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
      alert("Không thể hiển thị chi tiết đơn hàng");
    }
  }

  fetchOrderDetails();
