const API_PROMOTIONS = "http://localhost:3001/api/promotions";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

function getCartKey() {
  return `cart_${userId}`;
}

function getCart() {
  const cart = JSON.parse(localStorage.getItem(getCartKey())) || [];

  // Cập nhật giỏ hàng với thông tin tồn kho nếu thiếu
  return cart.map(item => {
    // Giả sử thông tin tồn kho đã có sẵn khi tải sản phẩm
    if (!item.stock) {
      item.stock = getProductStock(item.id);  // Lấy số lượng tồn kho từ API hoặc cơ sở dữ liệu
    }
    return item;
  });
}


function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  localStorage.setItem("cart", JSON.stringify(cart));
}

async function fetchPromotions() {
  try {
    const res = await fetch(`${API_PROMOTIONS}?status=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Lỗi khi tải chương trình khuyến mãi:", error);
    return [];
  }
}

function populatePromotionSelect(promotions) {
  const select = document.getElementById("promotionSelect");
  select.innerHTML = '<option value="">-- Không áp dụng khuyến mãi --</option>';
  promotions.forEach(promo => {
    const discountText = promo.discountType === "percentage"
      ? `${promo.discountValue}%`
      : `${promo.discountValue.toLocaleString()} đ`;
    const option = document.createElement("option");
    option.value = promo._id;
    option.textContent = `${promo.name} - ${discountText}`;
    select.appendChild(option);
  });
}

function renderCartItems() {
  const cart = getCart();
  const tbody = document.getElementById("cart-items");

  if (cart.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Giỏ hàng trống.</td></tr>';
    return;
  }

  tbody.innerHTML = cart.map((item, index) => {
    const discount = item.discount || 0;
    const itemTotal = item.price * item.quantity * (1 - discount / 100);
    return `
      <tr>
        <td>${item.name}</td>
        <td>${item.price.toLocaleString()} đ</td>
        <td>${discount}%</td>
        <td>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span class="mx-2">${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${index}, 1)" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
          </div>
        </td>
        <td>${itemTotal.toLocaleString()} đ</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})"> Xóa</button></td>
      </tr>
    `;
  }).join("");
}

// Tính toán giảm giá cho toàn bộ giỏ hàng
function calculatePromotionDiscount(promo, cart) {
  let discount = 0;
  const subtotal = cart.reduce((sum, item) => {
    const priceAfterDiscount = item.price * item.quantity * (1 - (item.discount || 0) / 100);
    return sum + priceAfterDiscount;
  }, 0);

  // Nếu giảm giá theo phần trăm
  if (promo.discountType === "percentage") {
    discount = subtotal * (promo.discountValue / 100);
  } else if (promo.discountType === "fixed") {
    // Nếu giảm giá theo số tiền cố định
    discount = promo.discountValue;
  }

  return discount;
}

// Cập nhật tổng chi phí với khuyến mãi
async function updateTotalWithPromotion() {
  const selectedPromoId = document.getElementById("promotionSelect")?.value;
  const promoNote = document.getElementById("promotion-note");
  const cart = getCart();
  const totalEl = document.getElementById("cart-total");

  const promotions = await fetchPromotions();
  const selectedPromo = promotions.find(p => p._id === selectedPromoId);

  let subtotal = 0;
  let promoDiscount = 0;

  // Tính tổng giá trị các sản phẩm trong giỏ hàng (trước khi áp dụng khuyến mãi)
  cart.forEach(item => {
    const discount = item.discount || 0;
    subtotal += item.price * item.quantity * (1 - discount / 100);
  });

  // Nếu có chương trình khuyến mãi, tính toán giảm giá
  if (selectedPromo) {
    promoDiscount = calculatePromotionDiscount(selectedPromo, cart);
  }

  // Nếu giảm giá là số tiền cố định, trừ trực tiếp vào tổng
  const finalTotal = Math.max(0, subtotal - promoDiscount);

  // Cập nhật thông báo chương trình khuyến mãi
  promoNote.textContent = selectedPromo ? `Đã áp dụng: ${selectedPromo.name}` : "Không có chương trình khuyến mãi nào được chọn.";
  
  // Cập nhật tổng chi phí sau khi áp dụng khuyến mãi
  totalEl.innerText = finalTotal.toLocaleString() + " đ";
  localStorage.setItem("finalTotal", finalTotal);
}


async function updateTotalWithPromotion() {
  const selectedPromoId = document.getElementById("promotionSelect")?.value;
  const promoNote = document.getElementById("promotion-note");
  const cart = getCart();
  const totalEl = document.getElementById("cart-total");

  const promotions = await fetchPromotions();
  const selectedPromo = promotions.find(p => p._id === selectedPromoId);

  let subtotal = 0;
  let promoDiscount = 0;

  cart.forEach(item => {
    const discount = item.discount || 0;
    subtotal += item.price * item.quantity * (1 - discount / 100);
  });

  if (selectedPromo) {
    promoDiscount = calculatePromotionDiscount(selectedPromo, cart);
  }

  const finalTotal = Math.max(0, subtotal - promoDiscount);

  promoNote.textContent = selectedPromo ? `Đã áp dụng: ${selectedPromo.name}` : "Không có chương trình khuyến mãi nào được chọn.";
  totalEl.innerText = finalTotal.toLocaleString() + " đ";
  localStorage.setItem("finalTotal", finalTotal);
}

function changeQuantity(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;

  const product = cart[index];
  const stock = product.stock; // Số lượng tồn kho của sản phẩm

  // Kiểm tra số lượng yêu cầu có vượt quá tồn kho không
  const newQuantity = product.quantity + delta;
  if (newQuantity < 1) return; // Không cho phép số lượng < 1
  if (newQuantity > stock) {
    alert(`Số lượng yêu cầu vượt quá tồn kho! Chỉ còn ${stock} sản phẩm.`);
    return;
  }

  // Cập nhật số lượng nếu hợp lệ
  product.quantity = newQuantity;
  saveCart(cart);
  renderCartItems();
  updateTotalWithPromotion();
  updateCartCount();
}


function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCartItems();
  updateTotalWithPromotion();
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", async () => {
  updateCartCount();

  if (!token || !userId) {
    localStorage.removeItem("cart"); // ✅ xóa cart tạm
    alert("⚠️ Vui lòng đăng nhập để xem và sử dụng giỏ hàng.");
    window.location.href = "/pages/DangNhap/DangNhap.html";
    return;
  }

  const promotions = await fetchPromotions();
  populatePromotionSelect(promotions);
  renderCartItems();
  await updateTotalWithPromotion();

  document.querySelector(".btn-success").addEventListener("click", function () {
    if (!token || !userId) {
      alert("⚠️ Vui lòng đăng nhập trước khi thanh toán.");
      window.location.href = "/pages/DangNhap/DangNhap.html";
      return;
    }

    const selectedPromoId = document.getElementById("promotionSelect")?.value;
    if (selectedPromoId) {
      localStorage.setItem("selectedPromotionId", selectedPromoId);
    } else {
      localStorage.removeItem("selectedPromotionId");
    }

    window.location.href = "/pages/DatHang/DatHang.html";
  });
});

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countEl = document.getElementById("cart-count");
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? "inline-block" : "none";
  }
}

document.getElementById("promotionSelect").addEventListener("change", function () {
  const selectedId = this.value;
  localStorage.setItem("selectedPromotionId", selectedId);
  updateTotalWithPromotion();
});

window.onload = async function () {
  const promotions = await fetchPromotions();
  const cart = getCart();

  let bestPromo = null;
  let bestDiscount = 0;

  promotions.forEach(promo => {
    const discount = calculatePromotionDiscount(promo, cart);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestPromo = promo;
    }
  });

  populatePromotionSelect(promotions);
  if (bestPromo) {
    document.getElementById("promotionSelect").value = bestPromo._id;
  }

  renderCartItems();
  await updateTotalWithPromotion();
};

const loginLink = document.getElementById("login-link");
if (loginLink) {
  if (token) {
    loginLink.textContent = "ĐĂNG XUẤT";
    loginLink.href = "#";
    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("cart"); // ✅ xóa giỏ tạm
      alert("Bạn đã đăng xuất thành công!");
      location.reload();
    });
  }
}

document.getElementById("clear-cart-btn")?.addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
    localStorage.removeItem(getCartKey());
    localStorage.removeItem("cart");
    location.reload();
  }
});

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const keyword = document.getElementById("search-input").value.trim();
  if (keyword) {
    window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
  }
});

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
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