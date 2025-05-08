
const PRODUCTS_PER_PAGE = 15;
let currentPage = 1;
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';      

    products.forEach(product => {
        if (!product.status) return; // ❌ Bỏ qua sản phẩm bị tắt
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
                    <button class="btn-cart btn btn-danger btn-sm w-100 mb-1" ${isOutOfStock ? 'disabled title="Sản phẩm đã hết hàng"'  : ''}>Thêm Vào Giỏ Hàng</button>
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

        // Sự kiện Thêm Vào Giỏ Hàng
        if (!isOutOfStock) {
            div.querySelector('.btn-cart')?.addEventListener('click', () => {
                const id = div.dataset.id;
                const name = div.dataset.name;
                const price = parseInt(div.dataset.price);
                const description = div.dataset.description;
                const image = div.dataset.image;
                const discount = parseInt(product.discount || 0);
                const stock = product.stock || 0; // ✅ lấy stock từ object sản phẩm
            
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
                const existing = cart.find(item => item.id === id);
                if (existing) {
                    if (existing.quantity < stock) {
                        existing.quantity += 1;
                    } else {
                        alert(`⚠️ Số lượng tồn kho không đủ để thêm sản phẩm`);
                        return;
                    }
                } else {
                    cart.push({ id, name, price, quantity: 1, description, image, discount, stock }); // ✅ thêm stock
                }
            
                localStorage.setItem('cart', JSON.stringify(cart));
                alert(`Đã thêm sản phẩm: ${name} vào giỏ hàng.`);
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
    let url = `http://localhost:3001/api/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    fetch(url) // ✅ Dùng đúng biến url đã có categoryId
        .then(res => res.json())
        .then(res => {
        renderProducts(res.data);
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
            if (cat.deletedAt || cat.status === false) return; // Ẩn danh mục bị xóa hoặc đang ẩn
            const li = document.createElement("li");
            li.innerHTML = `<a href="#" data-category-id="${cat._id}">${cat.name}</a>`;
            li.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            const categoryId = e.target.dataset.categoryId;
            const categoryName = e.target.textContent;
            fetchAndRender(1, categoryId); // Gọi lại với categoryId

             // ✅ Cập nhật tiêu đề
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

  // Gọi khi tải trang
loadCategoriesToSidebar();

// Gọi lần đầu
fetchAndRender();

const loginLink = document.getElementById("login-link");
if (loginLink) {
    const token = localStorage.getItem("token");
    if (token) {
        // Nếu đã đăng nhập → đổi thành ĐĂNG XUẤT
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("Bạn đã đăng xuất thành công!");
            location.reload(); // Reload trang
        });
    }
}