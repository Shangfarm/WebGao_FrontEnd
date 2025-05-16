let product = null;

// DOM loaded
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) {
        alert("Không tìm thấy sản phẩm.");
        return;
    }
    try {
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        product = await response.json();

        // Hiển thị thông tin sản phẩm
        document.getElementById("product-name").textContent = product.name;
        document.getElementById("product-desc").textContent = product.description || "Không có mô tả";
        document.getElementById("product-full-desc").textContent = product.description || "Không có mô tả";
        document.getElementById("product-img").src = product.image;
        document.getElementById("product-thumb").src = product.image;

        const originalPrice = document.getElementById("original-price");
        const salePrice = document.getElementById("sale-price");
        const discountCircle = document.getElementById("discount-circle");
        const quantityInput = document.getElementById("quantity");
        const stockInfo = document.getElementById("stock-info");
        const addToCartBtn = document.getElementById("add-to-cart-btn");
        const buyNowBtn = document.getElementById("buy-now-btn");
        const decreaseBtn = document.getElementById("decrease-qty");
        const increaseBtn = document.getElementById("increase-qty");

        if (product.discount && product.discount > 0) {
            const discountedPrice = product.price * (1 - product.discount / 100);
            originalPrice.textContent = product.price.toLocaleString("vi-VN") + " đ";
            originalPrice.style.textDecoration = "line-through";
            salePrice.textContent = discountedPrice.toLocaleString("vi-VN") + " đ";
            discountCircle.textContent = `-${product.discount}%`;
        } else {
            originalPrice.textContent = "";
            salePrice.textContent = product.price.toLocaleString("vi-VN") + " đ";
            discountCircle.style.display = "none";
        }
        if (product.stock <= 0) {
            quantityInput.value = 0;
            quantityInput.disabled = true;
            decreaseBtn.disabled = true;
            increaseBtn.disabled = true;
            addToCartBtn.disabled = true;
            buyNowBtn.disabled = true;
            stockInfo.innerHTML = `<span class="text-danger">Hết hàng</span>`;
        } else {
            quantityInput.value = 1;
            quantityInput.min = 1;
            quantityInput.max = product.stock;
            stockInfo.innerHTML = `Còn <span class="text-success">${product.stock}</span> sản phẩm`;
            decreaseBtn.addEventListener("click", () => {
                let qty = parseInt(quantityInput.value) || 1;
                if (qty > 1) quantityInput.value = qty - 1;
            });
            increaseBtn.addEventListener("click", () => {
                let qty = parseInt(quantityInput.value) || 1;
                if (qty < product.stock) {
                    quantityInput.value = qty + 1;
                } else {
                    alert(`⚠️ Chỉ còn ${product.stock} sản phẩm trong kho.`);
                }
            });
        }
        addToCartBtn.addEventListener("click", () => {
            if (!product || product.stock === 0) {
                alert("⚠️ Sản phẩm này đã hết hàng.");
                return;
            }
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            if (!token || !userId) {
                alert("⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
                return;
            }
            const quantity = parseInt(quantityInput.value) || 1;
            if (quantity > product.stock) {
                alert(`⚠️ Không đủ hàng trong kho. Chỉ còn ${product.stock} sản phẩm.`);
                return;
            }
            const cartKey = `cart_${userId}`;
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            const existing = cart.find(item => item.id === product._id);
            if (existing) {
                if (existing.quantity + quantity > product.stock) {
                    alert(`⚠️ Không đủ hàng trong kho. Tổng tối đa là ${product.stock}.`);
                    return;
                }
                existing.quantity += quantity;
            } else {
                cart.push({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    quantity,
                    discount: product.discount || 0,
                    description: product.description || "",
                    image: product.image || "",
                    stock: product.stock || 0,
                    category_id: product.category_id || null
                });
            }
            localStorage.setItem(cartKey, JSON.stringify(cart));
            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`✅ Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
        });
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        alert("Đã xảy ra lỗi khi tải sản phẩm.");
    }
    updateCartCount();
});

function updateCartCount() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const cartKey = `cart_${userId}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const cartCountEl = document.getElementById("cart-count");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = "inline-block";
    } else {
        cartCountEl.style.display = "none";
    }
}

document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const keyword = document.getElementById("search-input").value.trim();
    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});

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

document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const adminOnlyMenus = ["menu-discount", "menu-stats", "menu-shipping", "menu-user", "menu-order"];

    if (!token || role !== "admin") {
        adminOnlyMenus.forEach(id => {
            const item = document.getElementById(id);
            if (item) item.style.display = "none";
        });
    }
});