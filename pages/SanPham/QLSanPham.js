const apiProductUrl = "http://localhost:3001/api/products?limit=1000"
const apiCategoryUrl = "http://localhost:3001/api/categories"
let categoryMap = new Map()

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

// Nếu không có token thì chuyển hướng về login
if (!token) {
    alert("⚠️ Bạn chưa đăng nhập. Đang chuyển hướng...");
    window.location.href = "/DangNhap.html";
}

function hideAdminButtonsIfNeeded() {
    if (role !== "admin") {
      ["add-btn", "edit-btn", "delete-btn"].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = "none";
      });
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    hideAdminButtonsIfNeeded();
    loadCategoriesAndProducts();
  });

// Load danh mục và sản phẩm
async function loadCategoriesAndProducts() {
    try {
        const catRes = await fetch(apiCategoryUrl)
        const catJson = await catRes.json()
        catJson.data.forEach(cat => {
        categoryMap.set(cat._id, cat.name)
        })

        const prodRes = await fetch(apiProductUrl)
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
    select.innerHTML = `<option value="">-- Chọn danh mục --</option>`
    categories.forEach(cat => {
        const option = document.createElement("option")
        option.value = cat._id
        option.textContent = cat.name
        select.appendChild(option)
    })
}

// Hiển thị sản phẩm
function renderProducts(products) {
    const tbody = document.getElementById("product-table-body")
    tbody.innerHTML = ""

    products.forEach(prod => {
        const row = document.createElement("tr")
        row.innerHTML = `
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
        `
        tbody.appendChild(row)
    })
}

// Lấy dữ liệu form
function getFormData() {
    let rawDiscount = Number(document.getElementById("discount").value);
    if (isNaN(rawDiscount)) rawDiscount = 0;
    if (rawDiscount < 0) rawDiscount = 0;
    if (rawDiscount > 100) rawDiscount = 100;
  
    return {
      name: document.getElementById("name").value.trim(),
      description: document.getElementById("description").value.trim(),
      image: document.getElementById("image").value.trim(),
      price: Number(document.getElementById("price").value),
      stock: Number(document.getElementById("stock").value),
      categoryId: document.getElementById("categoryId").value,
      discount: rawDiscount,
      status: document.getElementById("status").checked
    };
}


// Clear form
function clearForm() {
    document.getElementById("product-id").value = ""
    document.getElementById("name").value = ""
    document.getElementById("description").value = ""
    document.getElementById("image").value = ""
    document.getElementById("price").value = ""
    document.getElementById("stock").value = ""
    document.getElementById("categoryId").value = ""
    document.getElementById("discount").value = ""
    document.getElementById("status").checked = true
}

// Thêm sản phẩm
document.getElementById("add-btn").addEventListener("click", async () => {
    const product = getFormData();
    if (!product.name || !product.price) return alert("Vui lòng nhập tên và giá");

    if (isNaN(product.discount) || product.discount < 0 || product.discount > 100) {
        return alert("❌ Giảm giá phải nằm trong khoảng từ 0% đến 100%");
    }
    if (isNaN(product.stock) || product.stock < 1 || product.stock > 1000) {
        return alert("❌ Số lượng kho phải nằm trong khoảng từ 1 đến 1000");
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
        alert("✅ Đã thêm sản phẩm");
        clearForm();
        loadCategoriesAndProducts();
    } else {
        alert("❌ " + result.message);
    }
});

// Sửa sản phẩm
document.getElementById("edit-btn").addEventListener("click", async () => {
    const id = document.getElementById("product-id").value
    if (!id) return alert("Chưa chọn sản phẩm để sửa")

    const product = getFormData()

    if (product.discount < 0 || product.discount > 100) {
        return alert("❌ Giảm giá phải từ 0% đến 100%")
    }
    if (isNaN(product.stock) || product.stock < 1 || product.stock > 1000) {
        return alert("❌ Số lượng kho phải nằm trong khoảng từ 1 đến 1000");
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
        alert("✅ Cập nhật thành công")
        clearForm()
        loadCategoriesAndProducts()
    } else {
        alert("❌ " + result.message)
    }
})

// Xóa sản phẩm
document.getElementById("delete-btn").addEventListener("click", async () => {
    const id = document.getElementById("product-id").value
    if (!id) return alert("Chưa chọn sản phẩm để xóa")
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return
    //API xóa sản phẩm 
    const res = await fetch(`${apiProductUrl.split("?")[0]}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    const result = await res.json()
    if (res.ok) {
        alert("✅ Đã xóa")
        clearForm()
        loadCategoriesAndProducts()
    } else {
        alert("❌ " + result.message)
    }
})

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
// giơi hạn giá và số lượng
document.getElementById("discount").addEventListener("input", (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 100) e.target.value = 100;
    if (value < 0) e.target.value = 0;
});
// Giới hạn giá
document.getElementById("stock").addEventListener("input", (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 1000) e.target.value = 1000;
    if (value < 1) e.target.value = 1;
});

document.addEventListener("DOMContentLoaded", loadCategoriesAndProducts)
