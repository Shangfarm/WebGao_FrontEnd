const apiUrl = "http://localhost:3001/api/categories";
const idInput = document.getElementById("category-id");
const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");
const statusInput = document.getElementById("status");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

function showToast(message, type = "success") {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor:
        type === "success" ? "#28a745" :
        type === "error" ? "#dc3545" :
        type === "warning" ? "#ffc107" : "#6c757d",
        stopOnFocus: true
    }).showToast();
}

// Nếu không có token => chuyển về trang login
if (!token) {
    showToast("⚠️ Bạn chưa đăng nhập. Đang chuyển hướng...");
    window.location.href = "/DangNhap.html";
}

if (role !== "admin") {
    document.getElementById("add-btn").style.display = "none";
    document.getElementById("edit-btn").style.display = "none";
    document.getElementById("delete-btn").style.display = "none";
    }
    function hideAdminButtonsIfNeeded() {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
        ["add-btn", "edit-btn", "delete-btn"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = "none";
    });
    }
}  

let showDeleted = false;
function toggleFormVisibility() {
    const formInputs = document.querySelector(".row.mb-3");
    if (formInputs) {
        formInputs.style.display = showDeleted ? "none" : "flex";
    }
}


function renderCategories() {
    const tbody = document.getElementById("category-table-body");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải...</td></tr>`;

    const urlWithFilter = showDeleted
        ? `${apiUrl}?showDeleted=true`
        : apiUrl;

        fetch(urlWithFilter, {
        headers: {
            "Authorization": `Bearer ${token}` // đảm bảo luôn có token
        }
        })
        .then(async (res) => {
            const result = await res.json();
            if (!res.ok) {
            throw new Error(result.message || "Lỗi API");
            }
            return result;
        })
        .then(res => {
            const tbody = document.getElementById("category-table-body");
            tbody.innerHTML = "";

            if (!res.data || res.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Không có danh mục</td></tr>`;
            return;
            }

            res.data.forEach((cat) => {
            if (!showDeleted && cat.deletedAt) return;
            if (showDeleted && !cat.deletedAt) return;
            const row = document.createElement("tr");
            const isDeleted = !!cat.deletedAt;
            row.innerHTML = `
                <td>${cat.name}</td>
                <td>${cat.description || ""}</td>
                <td>${cat.status ? "Hiện" : "Ẩn"}</td>
                <td>${new Date(cat.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                ${isDeleted
                    ? `
                        <div class="d-flex justify-content-center align-items-center gap-2">
                          <button class="btn btn-success btn-sm d-flex align-items-center gap-1" onclick="restoreCategory('${cat._id}')">
                            <i class="fa fa-rotate-left"></i> Khôi phục
                          </button>
                          <button class="btn btn-danger btn-sm d-flex align-items-center gap-1" onclick="deletePermanently('${cat._id}')">
                            <i class="fa fa-trash"></i> Xoá vĩnh viễn
                          </button>
                        </div>
                    `
                    : `<div class="text-center"><input type="radio" name="selected" value="${cat._id}" data-name="${cat.name}" data-desc="${cat.description}" data-status="${cat.status}"/></div>`
                }
                </td>
            `;
            tbody.appendChild(row);
            });

            // Ẩn/hiện nút
            ["add-btn", "edit-btn", "delete-btn"].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = showDeleted ? "none" : "inline-block";
            }
            });

            toggleFormVisibility();
        })
        .catch(error => {
            const tbody = document.getElementById("category-table-body");
            tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">❌ ${error.message}</td></tr>`;
            console.error("Lỗi khi tải danh mục:", error);
        });


}

function clearForm() {
    idInput.value = "";
    nameInput.value = "";
    descInput.value = "";
    statusInput.checked = true;
    const selected = document.querySelector('input[name="selected"]:checked');
    if (selected) selected.checked = false;
}

document.getElementById("add-btn").addEventListener("click", async () => {
    try {
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const status = statusInput.checked;

        if (!name) return showToast("Vui lòng nhập tên");

        // API Thêm danh mục 
        const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, status })
        });

        const result = await res.json();
        if (res.ok) {
        showToast("✅ Thêm thành công");
        clearForm();
        renderCategories();
        } else {
        showToast("❌ Lỗi: " + result.message);
        }
    } catch (error) {
        showToast("❌ Kết nối API thất bại");
        console.error(error);
    }
});

document.getElementById("edit-btn").addEventListener("click", async () => {
    try {
        const selected = document.querySelector('input[name="selected"]:checked');
        if (!selected) return showToast("Vui lòng chọn danh mục để sửa");

        const id = selected.value;
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const status = statusInput.checked;

        if (!name) return showToast("Vui lòng nhập tên");

        // API sửa danh mục 
        const res = await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, status })
            });

            const result = await res.json();
            if (res.ok) {
            showToast("✅ Cập nhật thành công");
            clearForm();
            renderCategories();
            } else {
            showToast("❌ Lỗi: " + result.message);
            }
        } catch (error) {
            showToast("❌ Cập nhật thất bại");
            console.error(error);
        }
});

document.getElementById("delete-btn").addEventListener("click", async () => {
    try {
        const selected = document.querySelector('input[name="selected"]:checked');
        if (!selected) return showToast("Vui lòng chọn danh mục để xóa", "warning");

        const confirmDelete = await Swal.fire({
            title: "Bạn chắc chắn muốn xóa?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Huỷ",
            confirmButtonColor: "#d33"
        });
        if (!confirmDelete.isConfirmed) return;

        const res = await fetch(`${apiUrl}/${selected.value}`, { 
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}` 
            }
        });
        const result = await res.json();

        if (res.ok) {
        showToast("✅ Đã xóa");
        clearForm();
        renderCategories();
        } else {
        showToast("❌ Lỗi: " + result.message);
        }
    } catch (error) {
        showToast("❌ Xóa thất bại");
        console.error(error);
    }
});

document.getElementById("category-table-body").addEventListener("change", (e) => {
    if (e.target.name === "selected") {
        const radio = e.target;
        idInput.value = radio.value;
        nameInput.value = radio.dataset.name || "";
        descInput.value = radio.dataset.desc || "";
        statusInput.checked = radio.dataset.status === "true";
    }
});

document.getElementById("btn-view-active").addEventListener("click", () => {
  showDeleted = false;
  document.getElementById("btn-view-active").classList.add("active");
  document.getElementById("btn-view-deleted").classList.remove("active");
  renderCategories();
});

document.getElementById("btn-view-deleted").addEventListener("click", () => {
  showDeleted = true;
  document.getElementById("btn-view-deleted").classList.add("active");
  document.getElementById("btn-view-active").classList.remove("active");
  renderCategories();
});

// Khôi phục
async function restoreCategory(id) {
  const confirmRestore = await Swal.fire({
    title: "Khôi phục danh mục này?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Khôi phục",
    cancelButtonText: "Huỷ",
    confirmButtonColor: "#28a745"
  });
  if (!confirmRestore.isConfirmed) return;

  try {
    const res = await fetch(`${apiUrl}/restore/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (res.ok) {
      showToast("✅ Đã khôi phục danh mục");
      renderCategories();
    } else {
      showToast("❌ Lỗi: " + result.message);
    }
  } catch (error) {
    console.error(error);
    showToast("❌ Khôi phục thất bại");
  }
}

// Xoá vĩnh viễn 
async function deletePermanently(id) {
const confirmPermanent = await Swal.fire({
  title: "⚠️ Xoá vĩnh viễn không thể khôi phục. Bạn chắc chứ?",
  icon: "error",
  showCancelButton: true,
  confirmButtonText: "Xoá vĩnh viễn",
  cancelButtonText: "Huỷ",
  confirmButtonColor: "#d33"
});
if (!confirmPermanent.isConfirmed) return;

  try {
    const res = await fetch(`${apiUrl}/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (res.ok) {
      showToast("✅ Đã xoá vĩnh viễn");
      renderCategories();
    } else {
      showToast("❌ Lỗi: " + result.message);
    }
  } catch (error) {
    console.error(error);
    showToast("❌ Xoá thất bại");
  }
}


renderCategories();