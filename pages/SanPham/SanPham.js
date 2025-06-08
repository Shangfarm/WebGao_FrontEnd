const PRODUCTS_PER_PAGE = 15;
let currentPage = 1;

// ----------------- Lấy keyword tìm kiếm từ URL -----------------
function getSearchKeyword() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("search")?.toLowerCase().trim() || "";
}

// ----------------- Hiển thị sản phẩm -----------------
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
        if (!product.status) return;
        const isOutOfStock = product.stock === 0;
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        const hasDiscount = product.discount && product.discount > 0;

        const div = document.createElement('div');
        div.className = 'product position-relative';
        div.setAttribute('data-id', product._id);
        div.setAttribute('data-name', product.name);
        div.setAttribute('data-price', product.price);
        div.setAttribute('data-description', product.description || '');
        div.setAttribute('data-image', product.image || '');

        div.innerHTML = `
            <div class="product-img-container position-relative">
                ${hasDiscount ? `<div class="product-discount badge bg-danger position-absolute top-0 start-0 m-2">-${product.discount}%</div>` : ''}
                ${isOutOfStock ? `<div class="product-out-of-stock badge bg-secondary position-absolute top-0 end-0 m-2">Hết hàng</div>` : ''}
                <a href="/pages/TTSanPham/TTSanPham.html?id=${product._id}">
                    <img src="${product.image}" alt="${product.name}" class="product-img clickable" />
                </a>
                <div class="product-actions mt-2">
                    <button class="btn-cart btn btn-danger btn-sm w-100 " ${isOutOfStock ? 'disabled title="Sản phẩm đã hết hàng"' : ''}>Thêm Vào Giỏ Hàng</button>
                </div>
            </div>
            <h3 class="text-center mt-2">
                <a href="/pages/TTSanPham/TTSanPham.html?id=${product._id}" class="text-decoration-none text-dark">
                    ${product.name}
                </a>
            </h3>
            <p class="price text-center">
                <span class="text-danger fw-bold">${discountedPrice.toLocaleString()} VND</span>
                ${hasDiscount ? `<small class="text-muted text-decoration-line-through ms-2">${product.price.toLocaleString()} VND</small>` : ''}
            </p>
            <p class="desc text-center">${product.description}</p>
        `;

        productList.appendChild(div);

        if (!isOutOfStock) {
            div.querySelector('.btn-cart')?.addEventListener('click', () => {
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");

                if (!token || !userId) {
                    showToast("⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.", "warning");
                    return;
                }

                const cartKey = `cart_${userId}`;
                const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

                const existing = cart.find(item => item.id === product._id);
                if (existing) {
                    if (existing.quantity < product.stock) {
                        existing.quantity += 1;
                    } else {
                        showToast("⚠️ Sản phẩm đã đạt tối đa tồn kho.", "warning");
                        return;
                    }
                } else {
                    cart.push({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        discount: product.discount || 0,
                        description: product.description || "",
                        image: product.image || "",
                        stock: product.stock || 0,
                        category_id: product.category_id || null
                    });
                }
                // Lưu vào đúng giỏ hàng người dùng
                localStorage.setItem(cartKey, JSON.stringify(cart));
                localStorage.setItem("cart", JSON.stringify(cart));
                showToast(`✅ Đã thêm "${product.name}" vào giỏ hàng.`, "success");
            });
        }
    });
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', e => {
            e.preventDefault();
            // --- Thêm đoạn này để luôn giữ searchKeyword khi đổi trang
            const searchKeyword = getSearchKeyword();
            if (searchKeyword) {
                // Đảm bảo khi đổi trang thì URL giữ tham số search và fetch lại đúng trang search
                window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(searchKeyword)}&page=${i}`;
            } else {
            fetchAndRender(i);
            }
        });
        pagination.appendChild(li);
    }
}

function fetchAndRender(page = 1, categoryId = "") {
    // Luôn đọc page và search
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get("search")?.toLowerCase().trim() || "";
    const urlPage = parseInt(urlParams.get("page")) || page;
    currentPage = urlPage;

    let url = `http://localhost:3001/api/products?page=${urlPage}&limit=${PRODUCTS_PER_PAGE}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (searchKeyword) url += `&search=${encodeURIComponent(searchKeyword)}`;

    fetch(url)
        .then(res => res.json())
        .then(res => {
            const products = res.data;
            // Cập nhật tiêu đề trang nếu đang search
            const pageTitle = document.getElementById("page-title");
            if (searchKeyword && pageTitle) {
                pageTitle.textContent = `Kết Quả Cho "${searchKeyword}"`;
            }
            renderProducts(products);
            renderPagination(res.pagination.totalPages);
        })
        .catch(err => {
            document.getElementById('product-list').innerHTML = '<p class="text-center text-danger">Không thể tải sản phẩm.</p>';
            console.error(err);
        });
}


function loadCategoriesToSidebar() {
    fetch("http://localhost:3001/api/categories")
    .then(res => res.json())
    .then(result => {
        const data = result.data || [];
        const ul = document.getElementById("category-sidebar");
        ul.innerHTML = "";

        // Thêm mục "Tất cả sản phẩm"
        const allItem = document.createElement("li");
        allItem.innerHTML = `<a href="#" data-category-id="">Tất cả sản phẩm</a>`;
        allItem.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            // Xóa search trên URL
            if (window.history.pushState) {
                const newUrl = window.location.pathname;
                window.history.pushState({path: newUrl}, '', newUrl);
            }
            fetchAndRender(1, "");
            const pageTitle = document.getElementById("page-title");
            if (pageTitle) {
                pageTitle.textContent = `SẢN PHẨM`;
            }
        });
        ul.appendChild(allItem);

        // Thêm các danh mục từ API
        data.forEach(cat => {
            if (cat.deletedAt || cat.status === false) return;
            const li = document.createElement("li");
            li.innerHTML = `<a href="#" data-category-id="${cat._id}">${cat.name}</a>`;
            li.querySelector("a").addEventListener("click", (e) => {
                e.preventDefault();
                const categoryId = e.target.dataset.categoryId;
                const categoryName = e.target.textContent;
                fetchAndRender(1, categoryId);
                const pageTitle = document.getElementById("page-title");
                if (pageTitle) {
                    pageTitle.textContent = `SẢN PHẨM – ${categoryName}`;
                }
            });
            ul.appendChild(li);
        });
    })
    .catch(err => {
        console.error("Lỗi khi tải danh mục:", err);
        const ul = document.getElementById("category-sidebar");
        ul.innerHTML = `<li class="text-danger">Không thể tải danh mục</li>`;
    });
}

// ----------------- Sự kiện khi DOM sẵn sàng -----------------
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    loadCategoriesToSidebar();
    fetchAndRender();
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
        // --------- Ẩn menu và admin buttons nếu không phải admin ---------
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    console.log("Token:", token);
    console.log("Role:", role);

    // Xử lý hiển thị các nút admin trong dropdown
    const adminOnlyMenus = [
        "menu-productManagement",
        "menu-discount",
        "menu-stats",
        "menu-shipping",
        "menu-user",
        "menu-order"
    ];
    if (!token || role !== "admin") {
        adminOnlyMenus.forEach(id => {
            const item = document.getElementById(id);
            if (item) item.style.display = "none";
        });
    }

    // Xử lý ẩn/hiện adminButtons
    const adminButtons = document.getElementById("adminButtons");
    const overlayLogin = document.getElementById("adminButtonsLoginOverlay");
    if (adminButtons) {
        if (token && role === "admin") {
            adminButtons.style.display = "flex";
            console.log("✅ Hiện adminButtons vì là admin");
            overlayLogin.style.display = "none";
        } else {
            adminButtons.style.display = "none";
            console.log("❌ Ẩn adminButtons vì chưa đăng nhập hoặc không phải admin");
            overlayLogin.style.display = "block";
        }
    }
});

// ----------------- Cập nhật giỏ hàng -----------------
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = "inline-block";
    } else {
        cartCountEl.style.display = "none";
    }
}

// ----------------- Xử lý Đăng nhập/Đăng xuất -----------------
const loginLink = document.getElementById("login-link");
if (loginLink) {
    const token = localStorage.getItem("token");
    if (token) {
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.clear();

            const toast = document.getElementById("logout-toast");
            if (toast) {
                toast.classList.add("show");
                setTimeout(() => {
                    toast.classList.remove("show");
                    setTimeout(() => {
                        toast.style.display = "none";
                        location.reload();
                    }, 500);
                }, 2000);
            }
        });
    }
}
document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const keyword = document.getElementById("search-input").value.trim();

    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});
function showToast(message, type = "info") {
    let bg = "#198754"; // xanh lá info
    if (type === "error") bg = "#dc3545";
    if (type === "warning") bg = "#ffc107";
    if (type === "success") bg = "#28a745";
    Toastify({
        text: message,
        duration: 2000,
        close: true,
        gravity: "top",
        position: "right",
        style: { background: bg, color: "#fff" }
    }).showToast();
}

document.getElementById("btnBangGia")?.addEventListener("click", async () => {
    try {
        const res = await fetch("/data/BangGiaGao-Thang6.json");
        const data = await res.json();

        const tbody = document.getElementById("bangGiaBody");
        tbody.innerHTML = "";

        data.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
            <td>${index + 1}</td>
            <td>${item.TenSanPham}</td>
            <td>${parseInt(item.GiaKgVND).toLocaleString()} VND</td>
            <td>${item.TenDanhMuc || "-"}</td>
            </tr>
        `;
        });

        document.getElementById("bangGiaModal").style.display = "flex";
    } catch (err) {
        showToast("❌ Không thể tải bảng giá gạo", "error");
        console.error("Lỗi bảng giá:", err);
    }
});

document.getElementById("btnExportPDF")?.addEventListener("click", () => {
    const element = document.getElementById("pdfContent");
    const opt = {
    margin:       [5, 10, 5, 10], // giảm top/bottom xuống để tránh trắng dư
    filename:     'BangGiaGao-Thang6.pdf',
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 3, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
});

// Sự kiện đóng
document.getElementById("closeBangGia")?.addEventListener("click", () => {
    document.getElementById("bangGiaModal").style.display = "none";
});
document.getElementById("closeBangGiaBtn")?.addEventListener("click", () => {
    document.getElementById("bangGiaModal").style.display = "none";
});
document.getElementById("modalOverlay")?.addEventListener("click", () => {
    document.getElementById("bangGiaModal").style.display = "none";
});

