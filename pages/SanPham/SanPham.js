// ----------------- Cấu hình -----------------
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
                <img src="${product.image}" alt="${product.name}" />
                <div class="product-actions mt-2">
                    <button class="btn-cart btn btn-danger btn-sm w-100 " ${isOutOfStock ? 'disabled title="Sản phẩm đã hết hàng"' : ''}>Thêm Vào Giỏ Hàng</button>
                    <button class="btn btn-success btn-sm w-100" ${isOutOfStock ? 'disabled' : ''}>Mua Ngay</button>
                </div>
            </div>
            <h3 class="text-center mt-2">${product.name}</h3>
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
                    alert("⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
                    return;
                }

                const cartKey = `cart_${userId}`;
                const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

                const existing = cart.find(item => item.id === product._id);
                if (existing) {
                    if (existing.quantity < product.stock) {
                        existing.quantity += 1;
                    } else {
                        alert("⚠️ Sản phẩm đã đạt tối đa tồn kho.");
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

                // ✅ Lưu vào đúng giỏ hàng người dùng
                localStorage.setItem(cartKey, JSON.stringify(cart));
                localStorage.setItem("cart", JSON.stringify(cart));
                alert(`✅ Đã thêm "${product.name}" vào giỏ hàng.`);
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
            fetchAndRender(i);
        });
        pagination.appendChild(li);
    }
}

function fetchAndRender(page = 1, categoryId = "") {
    currentPage = page;
    const searchKeyword = getSearchKeyword();
    let url = `http://localhost:3001/api/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`;
    if (categoryId) url += `&categoryId=${categoryId}`;

    fetch(url)
        .then(res => res.json())
        .then(res => {
            let products = res.data;

            if (searchKeyword) {
                products = products.filter(product =>
                    product.name.toLowerCase().includes(searchKeyword)
                );

                const pageTitle = document.getElementById("page-title");
                if (pageTitle) {
                    pageTitle.textContent = `Kết Quả Cho "${searchKeyword}"`;
                }
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

    // --------- Toggle khung tìm kiếm ---------
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
    if (adminButtons) {
        if (token && role === "admin") {
            adminButtons.style.display = "flex";
            console.log("✅ Hiện adminButtons vì là admin");
        } else {
            adminButtons.style.display = "none";
            console.log("❌ Ẩn adminButtons vì chưa đăng nhập hoặc không phải admin");
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
            localStorage.removeItem("token");
            alert("Bạn đã đăng xuất thành công!");
            location.reload();
        });
    }
}
document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault(); // Không reload
    const keyword = document.getElementById("search-input").value.trim();

    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});
