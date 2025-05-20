const apiProductUrl = "http://localhost:3001/api/products?limit=1000"
const apiCategoryUrl = "http://localhost:3001/api/categories"
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
let categoryMap = new Map()
let showDeleted = false;

// Nếu không có token thì chuyển hướng về login
if (!token) {
    showToast("⚠️ Bạn chưa đăng nhập. Đang chuyển hướng...");
    window.location.href = "/DangNhap.html";
}

function showToast(message, type = "success") {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        style: {
    background:
        type === "success" ? "#28a745" :
        type === "error" ? "#dc3545" :
        type === "warning" ? "#ffc107" : "#6c757d"
    },
        stopOnFocus: true
    }).showToast();
}

function hideAdminButtonsIfNeeded() {
    if (role !== "admin") {
        ["add-btn", "edit-btn", "delete-btn"].forEach((id) => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = "none";
        });
        }
    }

// *** THÊM HÀM XỬ LÝ HÌNH ẢNH VÀO ĐÂY ***
// Hàm xử lý upload ảnh từ máy tính
function setupImageUploadListener() {
    const imageUploadInput = document.getElementById('image-upload');
    const imageUrlInput = document.getElementById('image'); // Input text để chứa URL/DataURL
    const imagePreview = document.getElementById('image-preview');

    if (imageUploadInput && imageUrlInput && imagePreview) {
        imageUploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];  // Lấy file ảnh từ máy tính
            if (file) {
                // Hiển thị ảnh preview trước khi gửi lên server
                const reader = new FileReader();

                reader.onload = function(e) {
                    const imageUrl = e.target.result;  // Đây là Data URL
                    imageUrlInput.value = imageUrl;   // Hiển thị Data URL vào input text
                    imagePreview.src = imageUrl;      // Hiển thị ảnh lên trang
                    imagePreview.style.display = 'block'; // Hiện ảnh preview
                };

                reader.onerror = function(error) {
                    console.error("Lỗi FileReader: ", error);
                    showToast("Có lỗi xảy ra khi đọc file ảnh.");
                    // Reset nếu có lỗi
                    imageUrlInput.value = '';
                    imagePreview.src = '#';
                    imagePreview.style.display = 'none';
                };

                reader.readAsDataURL(file);  // Đọc ảnh dưới dạng DataURL
            }
        });
    }
}

// Hàm xử lý URL ảnh từ input
function setupImageUrlListener() {
    const imageUrlInput = document.getElementById('image'); // Trường nhập liệu URL
    const imagePreview = document.getElementById('image-preview');

    if (imageUrlInput && imagePreview) {
        imageUrlInput.addEventListener('input', function(event) {
            const imageUrl = event.target.value.trim();  // Lấy URL ảnh dán vào
            if (imageUrl) {
                // Kiểm tra xem URL có hợp lệ không
                const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
                if (urlPattern.test(imageUrl)) {
                    imagePreview.src = imageUrl;  // Hiển thị ảnh từ URL
                    imagePreview.style.display = 'block';  // Hiện ảnh xem trước
                } else {
                    imagePreview.src = '';  // Không hiển thị nếu URL không hợp lệ
                    imagePreview.style.display = 'none';
                }
            }
        });
    }
}


// Load danh mục và sản phẩm
async function loadCategoriesAndProducts() {
    try {
        const catRes = await fetch(apiCategoryUrl)
        const catJson = await catRes.json()
        catJson.data.forEach(cat => {
        categoryMap.set(cat._id, cat.name)
        })

        const prodRes = await fetch(
        showDeleted 
            ? apiProductUrl.split("?")[0] + "?limit=1000&showDeleted=true"
            : apiProductUrl
        );
        const prodJson = await prodRes.json()

        populateCategorySelect(catJson.data)
        renderProducts(prodJson.data)
    } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error)
    }
}

// Đổ danh mục vào dropdown
function populateCategorySelect(categories) {
    const select = document.getElementById("categoryId")
    const filterSelect = document.getElementById("filter-category")
    if (filterSelect) {
        filterSelect.innerHTML = `<option value="">-- Lọc theo danh mục --</option>`;
    }
    select.innerHTML = `<option value="">-- Chọn danh mục --</option>`
    categories.forEach(cat => {
    const option = document.createElement("option")
    option.value = cat._id
    option.textContent = cat.name
    select.appendChild(option); // ✅ thêm cho dropdown thêm/sửa
    if (filterSelect) {
        const filterOption = document.createElement("option");
        filterOption.value = cat._id;
        filterOption.textContent = cat.name;
        filterSelect.appendChild(filterOption); // ✅ thêm cho dropdown lọc
    }
});
}

// Hiển thị sản phẩm
function renderProducts(products) {
    const tbody = document.getElementById("product-table-body")
    tbody.innerHTML = ""

    products.forEach(prod => {
        const row = document.createElement("tr")
        const imageUrl = prod.image || 'placeholder.png';

        // Trường hợp sản phẩm đã bị xoá mềm
        if (prod.deletedAt) {
        row.innerHTML = `
            <td class="text-danger fw-bold">${prod.name} (Đã xoá)</td>
            <td><img src="${imageUrl}" width="40" height="40"/></td>
            <td>${prod.price.toLocaleString()}</td>
            <td>${prod.stock}</td>
            <td>${categoryMap.get(prod.categoryId) || "Không rõ"}</td>
            <td>${prod.discount || 0}%</td>
            <td>${prod.status ? "Hiện" : "Ẩn"}</td>
            <td class="text-center align-middle">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-success btn-sm" onclick="restoreProduct('${prod._id}')">
                    <i class="fa-solid fa-rotate-left me-1"></i> Khôi phục
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="permanentDeleteProduct('${prod._id}')">
                    <i class="fa-solid fa-trash me-1"></i> Xoá vĩnh viễn
                    </button>
                </div>
            </td>
        `;
        } else {
        // Trường hợp sản phẩm bình thường
        row.innerHTML = `
        </td>
        <td>${prod.name}</td>
        <td><img src="${prod.image}" width="40" height="40"/></td>
        <td>${prod.price.toLocaleString()}</td>
        <td>${prod.stock}</td>
        <td>${categoryMap.get(prod.categoryId) || "Không rõ"}</td>
        <td>${prod.discount || 0}%</td>
        <td>${prod.status ? "Hiện" : "Ẩn"}</td>
        <td>
            <input type="radio" name="selected" value="${prod._id}"
            data-name="${prod.name}" 
            data-description="${prod.description || ""}" 
            data-image="${prod.image || ""}" 
            data-price="${prod.price}" 
            data-stock="${prod.stock}" 
            data-category="${prod.categoryId || ""}" 
            data-discount="${prod.discount || 0}" 
            data-status="${prod.status}">
        </td>
            `;
        }
        tbody.appendChild(row);
    });
}

// Lấy dữ liệu form
function getFormData() {
    let rawDiscount = Number(document.getElementById("discount").value);
    if (isNaN(rawDiscount)) rawDiscount = 0;
    if (rawDiscount < 0) rawDiscount = 0;
    if (rawDiscount > 100) rawDiscount = 100;

    let imageUrl = document.getElementById("image").value.trim();

    // Nếu không có URL ảnh, dùng ảnh từ máy tính
    if (!imageUrl) {
        const imagePreview = document.getElementById("image-preview");
        if (imagePreview && imagePreview.src) {
            imageUrl = imagePreview.src;  // Lấy URL ảnh preview
        }
    }

    return {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        image: imageUrl,
        price: Number(document.getElementById("price").value),
        stock: Number(document.getElementById("stock").value),
        categoryId: document.getElementById("categoryId").value,
        discount: rawDiscount,
        status: document.getElementById("status").checked
    };
}


// Clear form
function clearForm() {
    document.getElementById("product-id").value = "";
    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("image").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("categoryId").value = "";
    document.getElementById("discount").value = "";
    document.getElementById("status").checked = true;
    
    // Reset image upload và preview
    const imageUploadInput = document.getElementById('image-upload');
    if (imageUploadInput) {
        imageUploadInput.value = null;  // Quan trọng để có thể chọn lại cùng 1 file
    }
    const imagePreview = document.getElementById('image-preview');
    if (imagePreview) {
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
    }
}


// Thêm sản phẩm
document.getElementById("add-btn").addEventListener("click", async () => {
    const product = getFormData();
    if (!product.name || !product.price) return showToast("Vui lòng nhập tên và giá");

    if (isNaN(product.discount) || product.discount < 0 || product.discount > 100) {
        return showToast("❌ Giảm giá phải nằm trong khoảng từ 0% đến 100%");
    }
    if (isNaN(product.stock) || product.stock < 0 || product.stock > 1000) {
        return showToast("❌ Số lượng kho phải nằm trong khoảng từ 0 đến 1000");
    }
    //API theme sản phẩm 
    const res = await fetch(apiProductUrl.split("?")[0], {
        method: "POST",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(product)
    });

    const result = await res.json();
    if (res.ok) {
        showToast("✅ Đã thêm sản phẩm");
        clearForm();
        loadCategoriesAndProducts();
    } else {
        showToast("❌ " + result.message);
    }
});

// Sửa sản phẩm
document.getElementById("edit-btn").addEventListener("click", async () => {
    const id = document.getElementById("product-id").value
    if (!id) return showToast("Chưa chọn sản phẩm để sửa")

    const product = getFormData()

    if (product.discount < 0 || product.discount > 100) {
        return showToast("❌ Giảm giá phải từ 0% đến 100%")
    }
    if (isNaN(product.stock) || product.stock < 0 || product.stock > 1000) {
        return showToast("❌ Số lượng kho phải nằm trong khoảng từ 0 đến 1000");
    }
    //API sửa sản phẩm 
    const res = await fetch(`${apiProductUrl.split("?")[0]}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(product)
    })

    const result = await res.json()
    if (res.ok) {
        showToast("✅ Cập nhật thành công")
        clearForm()
        loadCategoriesAndProducts()
    } else {
        showToast("❌ " + result.message)
    }
})

// Xóa mềm sản phẩm
document.getElementById("delete-btn").addEventListener("click", async () => {
    const id = document.getElementById("product-id").value
    if (!id) return showToast("Chưa chọn sản phẩm để xoá", "warning");
    const confirmDelete = await Swal.fire({
        title: "Xóa sản phẩm này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#d33"
    });

    if (!confirmDelete.isConfirmed) return;

    //API xóa sản phẩm 
    const res = await fetch(`${apiProductUrl.split("?")[0]}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    const result = await res.json()
    if (res.ok) {
        showToast("✅ Đã xoá sản phẩm", "success");
        clearForm()
        loadCategoriesAndProducts()
    } else {
        showToast("❌ Lỗi: " + result.message, "error");
    }
})

// Hàm khôi phục sản phẩm 
async function restoreProduct(id) {
    const confirmRestore = await Swal.fire({
        title: "Khôi phục sản phẩm này?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Khôi phục",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#28a745"
    });

    if (!confirmRestore.isConfirmed) return;

    try {
        const res = await fetch(`${apiProductUrl.split("?")[0]}/restore/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const result = await res.json();
        if (res.ok) {
            showToast("✅ Đã khôi phục sản phẩm", "success");
            loadCategoriesAndProducts();
        } else {
            showToast("❌ Lỗi: " + result.message, "error");
        }
    } catch (err) {
        showToast("❌ Khôi phục thất bại", "error");
    }
}

// Hàm xoá vĩnh viễn
async function permanentDeleteProduct(id) {
    const confirmDelete = await Swal.fire({
        title: "Xoá vĩnh viễn sản phẩm?",
        text: "Thao tác này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xoá vĩnh viễn",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#d33"
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        const res = await fetch(`${apiProductUrl.split("?")[0]}/delete/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
        });

        const result = await res.json();
        if (res.ok) {
        showToast("🗑️ Đã xoá vĩnh viễn sản phẩm", "success");
        loadCategoriesAndProducts();
        } else {
        showToast("❌ " + result.message, "error");
        }
    } catch (err) {
        showToast("❌ Lỗi khi xoá vĩnh viễn", "error");
    }
}

// Xử lý lọc và tìm kiếm
function applyFilter() {
    const searchKeyword = document.getElementById("search-input").value.trim().toLowerCase();
    const selectedCategoryId = document.getElementById("filter-category").value;

    // Lấy lại toàn bộ sản phẩm gốc từ server
    fetch(
        showDeleted
            ? apiProductUrl.split("?")[0] + "?limit=1000&showDeleted=true"
            : apiProductUrl
    )
    .then(res => res.json())
    .then(data => {
        let products = data.data;

        // Tìm theo tên
        if (searchKeyword) {
            products = products.filter(prod =>
                prod.name.toLowerCase().includes(searchKeyword)
            );
        }

        // Lọc theo danh mục
        if (selectedCategoryId) {
            products = products.filter(prod =>
                prod.categoryId === selectedCategoryId
            );
        }

        renderProducts(products);
    })
    .catch(error => {
        console.error("❌ Lỗi khi lọc dữ liệu:", error);
        showToast("❌ Không thể lọc sản phẩm", "error");
    });
}

// Xoá lọc
function resetFilter() {
    document.getElementById("search-input").value = "";
    document.getElementById("filter-category").value = "";
    loadCategoriesAndProducts(); // load lại toàn bộ
}

// Khi chọn sản phẩm → đổ dữ liệu lên form
document.getElementById("product-table-body").addEventListener("change", (e) => {
    if (e.target.name === "selected") {
        const prod = e.target.dataset
        document.getElementById("product-id").value = e.target.value
        document.getElementById("name").value = prod.name || ""
        document.getElementById("description").value = prod.description || ""
        document.getElementById("image").value = prod.image || ""
        document.getElementById("price").value = prod.price || ""
        document.getElementById("stock").value = prod.stock || ""
        document.getElementById("categoryId").value = prod.category || ""
        document.getElementById("discount").value = prod.discount || ""
        document.getElementById("status").checked = prod.status === "true"
    }
})
// Giới hạn % giảm
document.getElementById("discount").addEventListener("input", (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 100) {
        e.target.value = 100;
        showToast("⚠️ Giảm giá tối đa là 100%", "warning");
    }
    if (value < 0) {
        e.target.value = 0;
        showToast("⚠️ Giảm giá không được âm", "warning");
    }
});

// Giới hạn số lượng
document.getElementById("stock").addEventListener("input", (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 1000) {
        e.target.value = 1000;
        showToast("⚠️ Số lượng tối đa là 1000", "warning");
    }
    if (value < 0) {
        e.target.value = 0;
        showToast("⚠️ Số lượng không được âm", "warning");
    }
});


// Giới hạn giá tiền sản phẩm 
document.getElementById("price").addEventListener("input", function (e) {
    let value = parseInt(e.target.value, 10);

    if (value > 1000000) {
        e.target.value = 1000000;
        showToast("❌ Giá tối đa là 1.000.000 VND", "warning");
    }

    if (value < 0) {
        e.target.value = 0;
        showToast("❌ Giá không được âm", "warning");
    }
});


document.addEventListener("DOMContentLoaded", () => {
    hideAdminButtonsIfNeeded();
    setupImageUploadListener();
    setupImageUrlListener();
    loadCategoriesAndProducts();
});


document.getElementById("btn-view-active").addEventListener("click", () => {
    showDeleted = false;
    document.getElementById("btn-view-active").classList.add("active");
    document.getElementById("btn-view-deleted").classList.remove("active");
    loadCategoriesAndProducts();
});

document.getElementById("btn-view-deleted").addEventListener("click", () => {
    showDeleted = true;
    document.getElementById("btn-view-deleted").classList.add("active");
    document.getElementById("btn-view-active").classList.remove("active");
    loadCategoriesAndProducts();
});

document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilter();
});
