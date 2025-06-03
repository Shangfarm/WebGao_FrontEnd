const orderId = new URLSearchParams(window.location.search).get("orderId");
const resultCode = new URLSearchParams(window.location.search).get("resultCode");
const token = localStorage.getItem("token");

if (!orderId || !token) {
  alert("Thiếu mã đơn hàng hoặc bạn chưa đăng nhập!");
  window.location.href = "/pages/TrangChu/home.html";
}

// 👉 Hàm thông báo
function showToast(message, type = "info") {
  let bg = "#198754";
  if (type === "error") bg = "#dc3545";
  if (type === "warning") bg = "#ffc107";
  if (type === "success") bg = "#28a745";
  Toastify({
    text: message,
    duration: 2500,
    close: true,
    gravity: "top",
    position: "right",
    style: { background: bg, color: "#fff" }
  }).showToast();
}

// 👉 Hàm cập nhật đơn hàng nếu MoMo thanh toán thành công
async function updateOrderAfterMomo() {
  if (resultCode === "0" && orderId) {
    const tempOrder = JSON.parse(localStorage.getItem("momo_temp_order"));

    if (tempOrder) {
      try {
        await fetch(`http://localhost:3001/api/orders/momo/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(tempOrder)
        });

        // ✅ Xoá tất cả dữ liệu tạm và giỏ hàng
        localStorage.removeItem("momo_temp_order");
        localStorage.removeItem("cart");
        localStorage.removeItem(`cart_${localStorage.getItem("userId")}`);
        localStorage.removeItem("selectedPromotionId");
        localStorage.removeItem("selectedPromotionName");
         // ✅ Cập nhật biểu tượng giỏ hàng
        const cartCountEl = document.getElementById("cart-count");
        if (cartCountEl) {
          cartCountEl.textContent = "0";
          cartCountEl.style.display = "none";
        }
          showToast("🎉 Đã cập nhật đơn hàng MoMo và xoá giỏ hàng!", "success");
      } catch (error) {
        console.error("❌ Lỗi khi cập nhật đơn hàng MoMo:", error);
        showToast("⚠️ Không thể cập nhật đơn hàng sau thanh toán", "error");
      }
    } else {
      showToast("⚠️ Không tìm thấy dữ liệu đơn hàng tạm từ MoMo", "warning");
    }
  }
   // ✅ Hiển thị thông báo thanh toán MoMo theo resultCode
    if (resultCode !== null) {
      if (resultCode === "0") {
        showToast("🎉 Thanh toán MoMo thành công!", "success");
      } else {
        showToast("❌ Thanh toán MoMo thất bại hoặc bị hủy", "error");

        // ✅ Quay lại trang đặt hàng sau 2 giây
        setTimeout(() => {
          window.location.href = "/pages/DatHang/DatHang.html";
        }, 2000);
      }
    }
}

// 👉 Hàm lấy chi tiết đơn hàng
async function fetchOrderDetails() {
  try {
    const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Không thể lấy thông tin đơn hàng");

    const { data: order } = await res.json();
    console.log("Chi tiết đơn hàng:", order);

    document.getElementById("userName").textContent = order.userName;
    document.getElementById("phoneNumber").textContent = order.shippingAddress.phoneNumber;
    document.getElementById("address").textContent = `${order.shippingAddress.houseNumber}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`;

    document.getElementById("orderId").textContent = order._id;
    document.getElementById("createdAt").textContent = new Date(order.createdAt).toLocaleString();
    document.getElementById("paymentMethod").textContent = order.paymentMethod;
    document.getElementById("shippingMethod").textContent = `${order.shippingMethodId.name} (${order.shippingMethodId.price.toLocaleString()} đ)`;
    document.getElementById("promotionInfo").textContent = order.promotionId ? `${order.promotionId.name} - ${order.promotionId.discountType === "percentage" ? order.promotionId.discountValue + "%" : order.promotionId.discountValue.toLocaleString() + " đ"}` : "Không áp dụng";
    document.getElementById("couponInfo").textContent = order.couponId ? order.couponId.code : "Không áp dụng";

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

    const shippingFee = order.shippingMethodId.price || 0;
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let promotionDiscount = 0;
    let promotionText = "Không áp dụng";

    const promo = order.promotionId;
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

    document.getElementById("subtotal").textContent = subtotal.toLocaleString() + " đ";
    document.getElementById("promotionInfo").textContent = promotionText;
    document.getElementById("discount").textContent = `- ${promotionDiscount.toLocaleString()} đ`;
    document.getElementById("shippingFee").textContent = shippingFee.toLocaleString() + " đ";
    document.getElementById("totalAmount").textContent = order.totalAmount.toLocaleString() + " đ";

    document.getElementById("orderStatus").textContent = order.orderStatus;
    document.getElementById("shippingStatus").textContent = order.shippingStatus || "PROCESSING";

  } catch (err) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
    alert("Không thể hiển thị chi tiết đơn hàng");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Nếu là thanh toán qua MoMo và thất bại → quay lại trang đặt hàng
  const partnerCode = new URLSearchParams(window.location.search).get("partnerCode");
  if (partnerCode === "MOMO" && resultCode !== "0") {
    // ❌ Không hiển thị hóa đơn, chuyển hướng luôn
    window.location.href = "/pages/DatHang/DatHang.html";
    return;
  }

  // ✅ Nếu không phải thanh toán MoMo hoặc đã thành công
  await updateOrderAfterMomo(); // chỉ cập nhật nếu resultCode === "0"
  await fetchOrderDetails();    // luôn hiển thị hóa đơn
});

