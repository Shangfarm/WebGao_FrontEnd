
const apiUrl = "http://localhost:3001/api/categories";
const idInput = document.getElementById("category-id");
const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");
const statusInput = document.getElementById("status");


const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

// Nếu không có token => chuyển về trang login
if (!token) {
    alert("⚠️ Bạn chưa đăng nhập. Đang chuyển hướng...");
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

function renderCategories() {
    const tbody = document.getElementById("category-table-body");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải...</td></tr>`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(res => {
            const tbody = document.getElementById("category-table-body");
            tbody.innerHTML = "";
        
            if (!res.data || res.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Không có danh mục</td></tr>`;
                return;
            }
        
            res.data.forEach((cat) => {
                if (cat.deletedAt) return;
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${cat.name}</td>
                    <td>${cat.description || ""}</td>
                    <td>${cat.status ? "Hiện" : "Ẩn"}</td>
                    <td>${new Date(cat.createdAt).toLocaleString("vi-VN")}</td>
                    <td><input type="radio" name="selected" value="${cat._id}" data-name="${cat.name}" data-desc="${cat.description}" data-status="${cat.status}"/></td>
                `;
                tbody.appendChild(row);
            });
        })
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

        if (!name) return alert("Vui lòng nhập tên");

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
        alert("✅ Thêm thành công");
        clearForm();
        renderCategories();
        } else {
        alert("❌ Lỗi: " + result.message);
        }
    } catch (error) {
        alert("❌ Kết nối API thất bại");
        console.error(error);
    }
});

document.getElementById("edit-btn").addEventListener("click", async () => {
    try {
        const selected = document.querySelector('input[name="selected"]:checked');
        if (!selected) return alert("Vui lòng chọn danh mục để sửa");

        const id = selected.value;
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const status = statusInput.checked;

        if (!name) return alert("Vui lòng nhập tên");

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
            alert("✅ Cập nhật thành công");
            clearForm();
            renderCategories();
            } else {
            alert("❌ Lỗi: " + result.message);
            }
        } catch (error) {
            alert("❌ Cập nhật thất bại");
            console.error(error);
        }
});

document.getElementById("delete-btn").addEventListener("click", async () => {
    try {
        const selected = document.querySelector('input[name="selected"]:checked');
        if (!selected) return alert("Vui lòng chọn danh mục để xóa");

        if (!confirm("Bạn chắc chắn muốn xóa?")) return;

        const res = await fetch(`${apiUrl}/${selected.value}`, { 
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}` // ✅ thêm dòng này
            }
        });
        const result = await res.json();

        if (res.ok) {
        alert("✅ Đã xóa");
        clearForm();
        renderCategories();
        } else {
        alert("❌ Lỗi: " + result.message);
        }
    } catch (error) {
        alert("❌ Xóa thất bại");
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

renderCategories();