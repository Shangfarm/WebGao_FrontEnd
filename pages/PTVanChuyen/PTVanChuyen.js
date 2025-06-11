const API_BASE = "http://localhost:3001/api/shipping-methods";
let showDeletedOnly = false;
let currentPage = 1;
let currentLimit = 10;

const token = localStorage.getItem("token");
if (!token) {
    alert("Vui lòng đăng nhập trước khi truy cập trang này!");
    window.location.href = "/pages/login.html";
}

async function loadShippingMethods(page = 1) {
    const search = document.getElementById("searchInput").value;
    const query = new URLSearchParams({
        page,
        limit: currentLimit,
        ...(search && { search }),
        ...(showDeletedOnly && { status: "deleted" })
    });

    const res = await fetch(`${API_BASE}?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const { data, pagination } = await res.json();
    const tbody = document.getElementById("shippingMethodTableBody");
    tbody.innerHTML = "";

    data.forEach((method) => {
        const isDeleted = !!method.deletedAt;
        const row = document.createElement("tr");
        row.className = isDeleted ? "table-secondary text-muted" : "";

        row.innerHTML = `
            <td>${method.name}</td>
            <td>${method.description || "-"}</td>
            <td>${method.price.toLocaleString()} đ</td>
            <td>${method.estimatedDeliveryTime ? method.estimatedDeliveryTime + " ngày" : "-"}</td>
            <td>
            ${
                isDeleted
                ? `
                    <button class="btn btn-sm btn-success me-1" onclick='restoreShippingMethod("${method._id}")'>Khôi phục</button>
                    <button class="btn btn-sm btn-danger" onclick='deletePermanently("${method._id}")'>Xóa vĩnh viễn</button>
                `
                : `
                    <button class="btn btn-sm btn-warning me-1" onclick='editShippingMethod(${JSON.stringify(method)})'>Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick='deleteShippingMethod("${method._id}")'>Xóa</button>
                `
            }
            </td>
        `;

        tbody.appendChild(row);
    });

    renderPagination(pagination.totalPages, pagination.page);
}

function renderPagination(totalItems, itemsPerPage, currentPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById("pagination");

    // Xóa hết các nút cũ
    paginationContainer.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = `btn btn-sm mx-1 ${i === currentPage ? 'btn-success' : 'btn-outline-secondary'}`;
        btn.innerText = i;
        btn.onclick = () => goToPage(i);
        paginationContainer.appendChild(btn);
    }
}

window.showCreateForm = function () {
    document.getElementById("formTitle").textContent = "Tạo phương thức vận chuyển";
    document.getElementById("methodId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("fee").value = "";
    document.getElementById("estimatedDelivery").value = "";
    document.getElementById("shippingMethodFormSection").style.display = "block";
};

window.hideForm = function () {
    document.getElementById("shippingMethodFormSection").style.display = "none";
};

window.editShippingMethod = function (method) {
    document.getElementById("formTitle").textContent = "Chỉnh sửa phương thức vận chuyển";
    document.getElementById("methodId").value = method._id;
    document.getElementById("name").value = method.name;
    document.getElementById("description").value = method.description || "";
    document.getElementById("fee").value = method.price;
    document.getElementById("estimatedDelivery").value = method.estimatedDeliveryTime;
    document.getElementById("shippingMethodFormSection").style.display = "block";
};

window.submitForm = async function () {
    const id = document.getElementById("methodId").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE}/${id}` : API_BASE;

    const payload = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        price: Number(document.getElementById("fee").value),
        estimatedDeliveryTime: Number(document.getElementById("estimatedDelivery").value)
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
        showAlert("Lỗi: " + result.message, "error");
        return;
    }

    showAlert(id ? "Cập nhật thành công" : "Tạo mới thành công");
    hideForm();
    loadShippingMethods(currentPage);
};

window.deleteShippingMethod = async function (id) {
    const confirmResult = await showConfirmDialog("Bạn có chắc muốn xóa phương thức này không?");
    if (!confirmResult.isConfirmed) return;

    const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (!res.ok) {
        showAlert("Lỗi: " + result.message, "error");
        return;
    }

    showAlert("Đã chuyển vào mục đã xóa");
    loadShippingMethods(currentPage);
};

window.restoreShippingMethod = async function (id) {
    const confirmResult = await showConfirmDialog("Bạn có chắc muốn khôi phục phương thức này?");
    if (!confirmResult.isConfirmed) return;

    const res = await fetch(`${API_BASE}/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (!res.ok) {
        showAlert("Lỗi: " + result.message, "error");
        return;
    }

    showAlert("Đã khôi phục thành công");
    showDeletedOnly = false;
    loadShippingMethods(1);
};

window.deletePermanently = async function (id) {
    const confirmResult = await showConfirmDialog("Bạn có chắc muốn xóa vĩnh viễn phương thức này? Hành động này không thể hoàn tác.");
    if (!confirmResult.isConfirmed) return;

    const res = await fetch(`${API_BASE}/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (!res.ok) {
        showAlert("Lỗi: " + result.message, "error");
        return;
    }

    showAlert("Đã xóa vĩnh viễn");
    loadShippingMethods(currentPage);
};

// Các nút hành động
document.getElementById("showDeletedBtn").addEventListener("click", () => {
    showDeletedOnly = true;
    loadShippingMethods(1);
});

document.getElementById("showActiveBtn").addEventListener("click", () => {
    showDeletedOnly = false;
    loadShippingMethods(1);
});

document.getElementById("searchBtn").addEventListener("click", () => {
    loadShippingMethods(1);
});

// Khi trang sẵn sàng
window.onload = () => {
    showDeletedOnly = false;
    loadShippingMethods();
};
function goToPage(pageNumber) {
    loadShippingMethods(pageNumber);
}
function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const inputId = `page-${i}`;

        // Tạo input radio
        const input = document.createElement("input");
        input.type = "radio";
        input.className = "btn-check";
        input.name = "pageGroup";
        input.id = inputId;
        input.autocomplete = "off";
        input.checked = (i === currentPage);
        input.onclick = () => loadShippingMethods(i);

        // Tạo label tương ứng
        const label = document.createElement("label");
        label.className = `btn btn-outline-success`;
        label.setAttribute("for", inputId);
        label.innerText = i;

        paginationContainer.appendChild(input);
        paginationContainer.appendChild(label);
    }
}
// thông báo
function showAlert(title, icon = "success", timer = 2000) {
    Swal.fire({
        icon,
        title,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        toast: true,
        position: "top-end"
    });
}

function showConfirmDialog(message) {
    return Swal.fire({
        title: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy"
    });
}
