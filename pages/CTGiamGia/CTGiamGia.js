const API_BASE = "http://localhost:3001/api/promotions";
let currentPage = 1;
let currentLimit = 5;
let showDeletedOnly = false;

const token = localStorage.getItem("token");
if (!token) {
  alert("Vui lòng đăng nhập trước khi truy cập trang này!");
  window.location.href = "/pages/DangNhap/DangNhap.html";
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

    row.innerHTML = `
  <td>${promo.name}</td>
  <td>${promo.discountType === "percentage" ? promo.discountValue + "%" : promo.discountValue.toLocaleString() + " đ"}</td>
  <td>${new Date(promo.startDate).toLocaleDateString()} - ${new Date(promo.endDate).toLocaleDateString()}</td>
  <td>${promo.status ? "Đang hoạt động" : "Không hoạt động"}</td>
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
  } else {
    valueInput.min = 1000;
    valueInput.removeAttribute("max");
    valueInput.placeholder = "Giảm giá cố định (>= 1.000đ)";
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
  document.getElementById("status").value = promo.status ? "true" : "false";
  document.getElementById("promotionForm").style.display = "block";
  document.getElementById("discountType").dispatchEvent(new Event("change"));

    const today = new Date().toISOString().split('T')[0];
  document.getElementById("startDate").min = today;
  document.getElementById("endDate").min = today;
};

window.submitForm = async function () {
  const id = document.getElementById("promotionId").value;
  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/${id}` : API_BASE;

  const discountType = document.getElementById("discountType").value;
  const discountValue = parseFloat(document.getElementById("discountValue").value);

  // ✅ Ràng buộc đầu vào trước khi gửi
  if (discountType === "percentage") {
    if (discountValue < 0 || discountValue > 100) {
      alert("Giá trị phần trăm chỉ được từ 0 đến 100%");
      return;
    }
  } else {
    if (discountValue < 1000) {
      alert("Giá trị giảm cố định phải từ 1.000đ trở lên");
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
    alert("Lỗi: " + result.message);
    return;
  }

  alert(id ? "Cập nhật thành công" : "Tạo mới thành công");
  hideForm();
  loadPromotions(currentPage);
};


window.deletePromotion = async function (id) {
  if (!confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;

  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    alert("Lỗi: " + result.message);
    return;
  }

  alert("Đã xóa khuyến mãi");
  loadPromotions(currentPage);
};

window.restorePromotion = async function (id) {
  if (!confirm("Bạn có chắc muốn khôi phục khuyến mãi này?")) return;

  const res = await fetch(`${API_BASE}/${id}/restore`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    alert("Lỗi: " + result.message);
    return;
  }

  alert("Đã khôi phục khuyến mãi");
  loadPromotions(currentPage);
};

window.deletePermanently = async function (id) {
  if (!confirm("Bạn có chắc muốn xóa vĩnh viễn khuyến mãi này? Hành động này không thể hoàn tác.")) return;

  const res = await fetch(`${API_BASE}/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await res.json();
  if (!res.ok) {
    alert("Lỗi: " + result.message);
    return;
  }

  alert("Đã xóa vĩnh viễn khuyến mãi");
  loadPromotions(currentPage); // Reload lại danh sách
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
