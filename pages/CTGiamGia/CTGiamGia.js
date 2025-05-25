const API_BASE = "http://localhost:3001/api/promotions";
let currentPage = 1;
let currentLimit = 5;
let showDeletedOnly = false;

const token = localStorage.getItem("token");
if (!token) {
  alert("Vui lòng đăng nhập trước khi truy cập trang này!");
  window.location.href = "/pages/DangNhap/DangNhap.html";
}

// --- Toastify thông báo nhỏ giống quản lý sản phẩm ---
function showToast(message, type = "warning") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    style: {
      background: type === "success" ? "#28a745"
        : type === "error" ? "#dc3545"
        : type === "warning" ? "#ffc107"
        : "#6c757d"
    },
    stopOnFocus: true
  }).showToast();
}

async function loadPromotions(page = 1) {
  const search = document.getElementById("searchInput").value;
  const status = document.getElementById("statusFilter").value;
// ✅ Nếu không phải đang xem “đã xóa” thì không gửi deleted=true
  const query = new URLSearchParams({
    page,
    limit: currentLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...(showDeletedOnly && { deleted: "true" })
  });

  const res = await fetch(`${API_BASE}?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data, pagination } = await res.json();
  const tbody = document.querySelector("#promotionTable tbody");
  tbody.innerHTML = "";

  data.forEach((promo) => {
    const isDeleted = !!promo.deletedAt;
    const row = document.createElement("tr");
    row.className = isDeleted ? "table-secondary text-muted" : "";

    // Kiểm tra trạng thái thực tế dựa vào ngày hiện tại
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    const isActive = promo.status && now >= start && now <= end;

    row.innerHTML = `
      <td>${promo.name}</td>
      <td>${promo.discountType === "percentage" ? promo.discountValue + "%" : promo.discountValue.toLocaleString() + " đ"}</td>
      <td>${new Date(promo.startDate).toLocaleDateString()} - ${new Date(promo.endDate).toLocaleDateString()}</td>
      <td>${isActive ? "Đang hoạt động" : "Không hoạt động"}</td>
  <td>
    ${
      isDeleted
        ? `
          <button class="btn btn-sm btn-success me-1" onclick='restorePromotion("${promo._id}")'>Khôi phục</button>
          <button class="btn btn-sm btn-danger" onclick='deletePermanently("${promo._id}")'>Xóa vĩnh viễn</button>
        `
        : `
          <button class="btn btn-sm btn-warning me-1 edit-btn" data-promo="${encodeURIComponent(JSON.stringify(promo))}">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick='deletePromotion("${promo._id}")'>Xóa</button>
        `
    }
  </td>
`;
    tbody.appendChild(row);
    const editBtn = row.querySelector(".edit-btn");
if (editBtn) {
  editBtn.addEventListener("click", () => {
    const promo = JSON.parse(decodeURIComponent(editBtn.dataset.promo));
    editPromotion(promo);
  });
}
  });

  renderPagination(pagination.totalPages, pagination.page);
}

function renderPagination(totalPages, page) {
  currentPage = page;
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${i === page ? "btn-primary" : "btn-outline-primary"} mx-1`;
    btn.textContent = i;
    btn.onclick = () => loadPromotions(i);
    container.appendChild(btn);
  }
}

document.getElementById("discountType").addEventListener("change", function () {
  const valueInput = document.getElementById("discountValue");
  if (this.value === "percentage") {
    valueInput.min = 0;
    valueInput.max = 100;
    valueInput.placeholder = "Giảm (%) từ 0 - 100";
    if (parseFloat(valueInput.value) > 100) valueInput.value = 100;
    if (parseFloat(valueInput.value) < 0) valueInput.value = 0;
  } else {
    valueInput.min = 0;
    valueInput.max = 100000;
    valueInput.placeholder = "Giảm giá cố định (0 - 100.000đ)";
    if (parseFloat(valueInput.value) > 100000) valueInput.value = 100000;
    if (parseFloat(valueInput.value) < 1000) valueInput.value = 1000;
  }
});

document.getElementById("discountValue").addEventListener("input", function () {
  const type = document.getElementById("discountType").value;
  let value = parseFloat(this.value) || 0;
    if (type === "fixed") {
    if (value > 100000) {
      this.value = 100000;
      showToast("⚠️ Số tiền giảm tối đa là 100.000 VND", "warning");
    }
    if (value < 0) {
      this.value = 0;
      showToast("⚠️ Số tiền giảm không được âm", "warning");
    }
  } else {
    if (value > 100) {
      this.value = 100;
      showToast("⚠️ Giảm giá tối đa là 100%", "warning");
    }
    if (value < 0) {
      this.value = 0;
      showToast("⚠️ Giảm giá không được âm", "warning");
    }
  }
});

window.showCreateForm = function () {
  document.getElementById("formTitle").textContent = "Tạo khuyến mãi";
  document.getElementById("promotionId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("description").value = "";
  document.getElementById("discountType").value = "percentage";
  document.getElementById("discountValue").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("status").value = "true";
  document.getElementById("promotionForm").style.display = "block";
  document.getElementById("discountType").dispatchEvent(new Event("change"));

    // ✅ Ràng buộc ngày bắt đầu từ hôm nay trở đi
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("startDate").min = today;
  document.getElementById("endDate").min = today;
};

window.hideForm = function () {
  document.getElementById("promotionForm").style.display = "none";
};

window.editPromotion = function (promo) {
  document.getElementById("formTitle").textContent = "Chỉnh sửa khuyến mãi";
  document.getElementById("promotionId").value = promo._id;
  document.getElementById("name").value = promo.name;
  document.getElementById("description").value = promo.description || "";
  document.getElementById("discountType").value = promo.discountType;
  document.getElementById("discountValue").value = promo.discountValue;
  document.getElementById("startDate").value = promo.startDate.split("T")[0];
  document.getElementById("endDate").value = promo.endDate.split("T")[0];
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  const isActive = promo.status && now >= start && now <= end;
  document.getElementById("status").value = promo.status ? "true" : "false"; 

  document.getElementById("promotionForm").style.display = "block";
  document.getElementById("discountType").dispatchEvent(new Event("change"));

    const today = new Date().toISOString().split('T')[0];
  document.getElementById("startDate").min = today;
  document.getElementById("endDate").min = today;
};

window.submitForm = async function () {

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Thêm đoạn kiểm tra này
  if (new Date(startDate) > new Date(endDate)) {
    showToast("❌ Ngày bắt đầu không được lớn hơn ngày kết thúc!", "error");
    document.getElementById("startDate").focus();
    return;
  }

  const id = document.getElementById("promotionId").value;
  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/${id}` : API_BASE;

  const discountType = document.getElementById("discountType").value;
  const discountValue = parseFloat(document.getElementById("discountValue").value);

  // ✅ Ràng buộc đầu vào trước khi gửi
  if (discountType === "percentage") {
    if (discountValue < 0 || discountValue > 100) {
      showToast("❌ Giá trị phần trăm chỉ từ 0 đến 100%", "error");
      document.getElementById("discountValue").focus();
      return;
    }
  } else {
    if (discountValue < 0 || discountValue > 100000) {
      showToast("❌ Số tiền giảm cố định chỉ từ 0 đến 100.000đ", "error");
      document.getElementById("discountValue").focus();
      return;
    }
  }

  const payload = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    discountType,
    discountValue,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    status: document.getElementById("status").value === "true"
  };

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json();

  if (!res.ok) {
    Swal.fire("Lỗi!", result.message, "error");
    return;
  }
  Swal.fire({
    icon: "success",
    title: id ? "Cập nhật khuyến mãi thành công" : "Tạo mới khuyến mãi thành công",
    showConfirmButton: false,
    timer: 1200
  });
  hideForm();
  loadPromotions(currentPage);
};

window.deletePromotion = async function (id) {
  const confirmDelete = await Swal.fire({
    title: "Xác nhận xoá?",
    text: "Bạn có chắc muốn xoá khuyến mãi này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xoá",
    cancelButtonText: "Huỷ",
    confirmButtonColor: "#d33"
  });

  if (!confirmDelete.isConfirmed) return;

  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    Swal.fire("Lỗi!", result.message, "error");
    return;
  }

  Swal.fire("Đã xoá!", "Khuyến mãi đã được xoá.", "success");
  loadPromotions(currentPage);
};


window.restorePromotion = async function (id) {
  const confirmRestore = await Swal.fire({
    title: "Khôi phục khuyến mãi?",
    text: "Bạn có muốn khôi phục khuyến mãi này?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Khôi phục",
    cancelButtonText: "Huỷ",
    confirmButtonColor: "#28a745"
  });

  if (!confirmRestore.isConfirmed) return;

  const res = await fetch(`${API_BASE}/${id}/restore`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    Swal.fire("Lỗi!", result.message, "error");
    return;
  }

  Swal.fire("Đã khôi phục!", "Khuyến mãi đã được khôi phục.", "success");
  loadPromotions(currentPage);
};


window.deletePermanently = async function (id) {
  const confirmDelete = await Swal.fire({
    title: "Xoá vĩnh viễn?",
    text: "Bạn có chắc muốn xoá vĩnh viễn khuyến mãi này? Hành động này không thể hoàn tác!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xoá vĩnh viễn",
    cancelButtonText: "Huỷ",
    confirmButtonColor: "#d33"
  });

  if (!confirmDelete.isConfirmed) return;

  const res = await fetch(`${API_BASE}/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    Swal.fire("Lỗi!", result.message, "error");
    return;
  }

  Swal.fire("Đã xoá vĩnh viễn!", "Khuyến mãi đã bị xoá khỏi hệ thống.", "success");
  loadPromotions(currentPage);
};



// Nút xem đã xóa
document.getElementById("showDeletedBtn").addEventListener("click", () => {
  showDeletedOnly = true;
  loadPromotions(1);
});

// Nút xem chưa xóa (nếu bạn muốn thêm)
document.getElementById("showNotDeletedBtn")?.addEventListener("click", () => {
  showDeletedOnly = false;
  loadPromotions(1);
});

// Mặc định tải chưa xóa
window.onload = () => {
  showDeletedOnly = false;
  loadPromotions(); // sau đó mới render bảng

};

window.onSearchClick = () => {
  showDeletedOnly = false; // 🛠 reset về mặc định (chưa xóa)
  loadPromotions(1);
};
// Cập nhật số lượng sản phẩm trong giỏ hàng
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");

    // ✅ Nếu phần tử không tồn tại thì thoát ra, không làm gì cả
    if (!cartCountEl) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = "inline-block";
    } else {
        cartCountEl.style.display = "none";
    }
}


// ---------------- Tìm kiếm -----------------------
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

document.getElementById("startDate").addEventListener("change", function () {
  document.getElementById("endDate").min = this.value;
});
document.getElementById("endDate").addEventListener("change", function () {
  document.getElementById("startDate").max = this.value;
});
