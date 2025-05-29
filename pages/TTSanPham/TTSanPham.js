let product = null;

// Định nghĩa hàm loadReviews NGAY TỪ ĐẦU để tránh lỗi "not defined"
async function loadReviews(productId) {
    try {
        const res = await fetch(`http://localhost:3001/api/reviews/${productId}`);
        const result = await res.json();
        const reviewList = document.getElementById("review-list");
        reviewList.innerHTML = "";

        const currentUser = {
            id: localStorage.getItem("userId"),
            username: localStorage.getItem("username") || "Ẩn danh",
            avatar: localStorage.getItem("avatar") || "https://ui-avatars.com/api/?name=User&background=ddd&color=555"
        };  

        if (!result.data || result.data.length === 0) {
            reviewList.innerHTML = `<p class="fst-italic text-muted">Chưa có đánh giá nào.</p>`;
            return;
        }

        reviewList.innerHTML = `<h5 class="mb-3">${result.data.length} đánh giá</h5>`;

        result.data.forEach(review => {
            const stars = Array.from({ length: 5 }, (_, i) =>
                `<i class="fa fa-star ${i < review.rating ? "text-warning" : "text-muted"}"></i>`
            ).join("");

            const avatarUrl = review.userId?.avatar || "/images/default-avatar.png";
            const displayName = review.userId?.username || "Ẩn danh";
            const isOwnReview = currentUser.id === review.userId?._id;

            const repliesHtml = (review.replies || [])
            .map(reply => {
                const replyAvatar = reply.userId?.avatar || 'https://ui-avatars.com/api/?name=Ẩn+danh&background=ddd&color=555';
                const replyUsername = reply.userId?.username || "Ẩn danh";
                return `
                <div class="ms-5 mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${replyAvatar}" class="rounded-circle" width="30" height="30" />
                        <strong>${replyUsername}</strong>
                        <small class="text-muted">${new Date(reply.createdAt).toLocaleDateString("vi-VN")}</small>
                    </div>
                    <p class="ms-5 fst-italic mb-1">${reply.comment}</p>
                </div>
                `;
            })
            .join("");
            const html = `
                <div class="mb-3 border-bottom pb-2 review-item" data-id="${review._id}">
                    <div class="d-flex justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                            <img src="${avatarUrl}" alt="Avatar" class="rounded-circle" 
                                style="width: 40px; height: 40px; object-fit: cover;" />
                            <div>
                                <strong>${displayName}</strong> - 
                                <span class="text-muted">${new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                                <div class="review-stars">${stars}</div>
                            </div>
                        </div>

                        ${isOwnReview ? `
                        <div class="review-action dropdown">
                            <button class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style="background: transparent; border: none;">
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item edit-review" href="#">✏️ Sửa</a></li>
                                <li><a class="dropdown-item delete-review" href="#">🗑️ Xóa</a></li>
                            </ul>
                        </div>` : ""}
                    </div>
                    <p class="mt-2 fst-italic review-comment">${review.comment || ""}</p>
                    ${repliesHtml}
                    <!-- ✅ Form trả lời -->
                    <p class="small ms-2 text-primary reply-toggle" style="cursor: pointer;">Trả lời</p>
                    <div class="reply-box ms-5 mt-2 d-none">
                        <div class="d-flex align-items-center gap-2">
                            <img src="${currentUser.avatar}" class="rounded-circle" width="32" height="32" />
                            <input type="text" class="form-control reply-input flex-grow-1" placeholder="Viết phản hồi..." />
                            <button class="btn btn-link send-reply-btn" style="font-size: 20px;">
                                <i class="fa fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            reviewList.innerHTML += html;
        });
        addReviewActions();
        addReplyEvents();
    } catch (err) {
        console.error("Lỗi khi tải đánh giá:", err);
        document.getElementById("review-list").innerHTML = `<p class="text-danger">Không thể tải đánh giá.</p>`;
    }
}

//Trả lời đánh giá
function addReplyEvents() {
    // Toggle hiển thị form trả lời
    document.querySelectorAll(".reply-toggle").forEach(toggle => {
        toggle.addEventListener("click", () => {
        const replyBox = toggle.nextElementSibling;
        if (replyBox) replyBox.classList.toggle("d-none");
        });
    });

    // Gửi trả lời
    document.querySelectorAll(".send-reply-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const wrapper = btn.closest(".review-item");
            const reviewId = wrapper.dataset.id;
            const input = wrapper.querySelector(".reply-input");
            const comment = input.value.trim();
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!comment) return;
            if (!token || !userId) return showToast("⚠️ Bạn cần đăng nhập.", "warning");

            try {
                const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ comment, userId })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Gửi thất bại");

                input.value = "";
                loadReviews(product._id);
            } catch (err) {
                showToast("❌ Lỗi khi gửi phản hồi.", "error");
            }
        });
    });
}


function addReviewActions() {
    document.querySelectorAll(".edit-review").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const reviewEl = btn.closest(".review-item");
            const commentEl = reviewEl.querySelector(".review-comment");
            const reviewId = reviewEl.dataset.id;
            const oldComment = commentEl.textContent.trim();
            const { value: formValues } = await Swal.fire({
                title: "Sửa đánh giá",
                html: `
                <input id="swal-new-comment" class="swal2-input" placeholder="Nhận xét mới" value="${oldComment}">
                <div id="swal-rating" style="margin-top: 5px;">
                    ${[1, 2, 3, 4, 5].map(i => `<i class="fa fa-star star-icon" data-star="${i}" style="font-size: 22px; cursor: pointer;"></i>`).join('')}
                </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Lưu",
                cancelButtonText: "Hủy",
                didOpen: () => {
                    const stars = Swal.getPopup().querySelectorAll(".star-icon");
                    stars.forEach((star, idx) => {
                        star.addEventListener("click", () => {
                        stars.forEach((s, i) => {
                            s.classList[i <= idx ? "add" : "remove"]("text-warning");
                        });
                        Swal.getPopup().dataset.rating = idx + 1;
                        });
                    });
                },
                preConfirm: () => {
                    const comment = document.getElementById("swal-new-comment").value.trim();
                    const rating = Swal.getPopup().dataset.rating;
                    if (!comment || !rating) {
                        Swal.showValidationMessage("Vui lòng nhập nội dung và chọn số sao");
                    }
                    return { comment, rating };
                }
            });

            if (formValues) {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(formValues)
                    });

                    if (!res.ok) throw new Error("Cập nhật thất bại");
                    Swal.fire("✅ Thành công", "Đánh giá đã được cập nhật", "success");
                    loadReviews(product._id);
                } catch (err) {
                    console.error("Lỗi khi sửa:", err);
                    Swal.fire("Lỗi", "Không thể sửa đánh giá.", "error");
                }
            }
        });
    });

    document.querySelectorAll(".delete-review").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const reviewId = btn.closest(".review-item").dataset.id;

            Swal.fire({
                title: "Bạn có chắc muốn xóa?",
                text: "Hành động này sẽ xóa vĩnh viễn đánh giá.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Xóa",
                cancelButtonText: "Hủy"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                        });

                        if (!res.ok) throw new Error("Xóa thất bại");
                        Swal.fire("✅ Đã xóa!", "Đánh giá đã được xóa.", "success");
                        loadReviews(product._id);
                    } catch (err) {
                        console.error("Lỗi khi xóa:", err);
                        Swal.fire("Lỗi", "Không thể xóa đánh giá.", "error");
                    }
                }
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) {
        showToast("Không tìm thấy sản phẩm.", "error");
        return;
    }

    try {
        // 👉 Gọi API lấy thông tin sản phẩm
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        product = await response.json();

        // 👉 Hiển thị chi tiết sản phẩm
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

        // 👉 Hiển thị giá và giảm giá nếu có
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

    // 👉 Kiểm tra tồn kho để bật/tắt các nút mua
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
                showToast(`⚠️ Chỉ còn ${product.stock} sản phẩm trong kho.`, "warning");
                }
            });
        }

        // 👉 Thêm vào giỏ hàng
        addToCartBtn.addEventListener("click", () => {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            if (!token || !userId) {
                showToast("⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.", "warning");
                return;
            }
            const quantity = parseInt(quantityInput.value) || 1;
            const cartKey = `cart_${userId}`;
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            const existing = cart.find(item => item.id === product._id);
            if (existing) {
                if (existing.quantity + quantity > product.stock) {
                    showToast(`⚠️ Không đủ hàng trong kho. Tổng tối đa là ${product.stock}.`, "warning");
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
            showToast(`✅ Đã thêm ${quantity} sản phẩm vào giỏ hàng.`, "success");
        });

        // 👉 Khởi tạo giao diện đánh giá sao (1-5)
        const reviewStars = document.getElementById("review-stars");
        let selectedRating = 0;
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.className = "fa fa-star text-muted me-1";
            star.style.cursor = "pointer";
            star.dataset.rating = i;
            star.addEventListener("click", () => {
                selectedRating = i;
                [...reviewStars.children].forEach((s, idx) => {
                    s.className = `fa fa-star ${idx < i ? "text-warning" : "text-muted"} me-1`;
                });
            });
            reviewStars.appendChild(star);
        }

        document.getElementById("submit-review-btn").addEventListener("click", async () => {
            const userId = localStorage.getItem("userId");
            const token = localStorage.getItem("token");
            const comment = document.getElementById("review-comment").value.trim();

            if (!userId || !token) return showToast("⚠️ Bạn cần đăng nhập để đánh giá.", "warning");
            if (!product || !product._id) return showToast("⚠️ Không tìm thấy sản phẩm.", "error");
            if (selectedRating === 0) return showToast("⚠️ Vui lòng chọn số sao.", "warning");

            try {
                const res = await fetch("http://localhost:3001/api/reviews", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId,
                        productId: product._id,
                        rating: selectedRating,
                        comment
                    })
                });
                const data = await res.json();
                if (!res.ok) {
                    console.log("❌ Server trả lỗi:", data);
                    const errorMsg = data?.error || data?.message || "Không rõ lỗi";
                    return showToast("❌ " + errorMsg, "error");
                }

                showToast("✅ Đánh giá của bạn đã được gửi!", "success");
                document.getElementById("review-comment").value = "";
                selectedRating = 0;
                [...reviewStars.children].forEach(star => star.className = "fa fa-star text-muted me-1");
                loadReviews(product._id);
            } catch (err) {
                showToast("❌ " + err.message, "error");
            }
        });
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        showToast("Đã xảy ra lỗi khi tải sản phẩm.", "error");
    }
    // 👉 Load & xử lý đánh giá (bao gồm sửa/xóa)
        await loadReviews(product._id);
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
            showToast("Bạn đã đăng xuất thành công!", "success");
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
document.getElementById("btn-tab-description").addEventListener("click", () => {
    document.getElementById("tab-description").style.display = "block";
    document.getElementById("tab-review").style.display = "none";
});

document.getElementById("btn-tab-review").addEventListener("click", () => {
    document.getElementById("tab-description").style.display = "none";
    document.getElementById("tab-review").style.display = "block";
});
//Nút thíhch
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

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const wishlistBtn = document.getElementById("btn-wishlist");
    const heartIcon = document.getElementById("heart-icon");

    // ✅ Nếu đã đăng nhập, kiểm tra xem đã thích sản phẩm chưa
    if (userId && token && productId) {
        fetch(`http://localhost:3001/api/wishlist/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(result => {
            const wishlist = result.data || [];
            const exists = wishlist.find(item => item.productId._id === productId);
            if (exists) {
                heartIcon.classList.add("text-danger");
                wishlistBtn.dataset.inWishlist = exists._id; // lưu _id của wishlist để xóa nếu cần
            }
        });
    }

    // 👉 Sự kiện nhấn nút ❤️
    wishlistBtn.addEventListener("click", async () => {
        if (!userId || !token) {
            showToast("⚠️ Bạn cần đăng nhập để sử dụng tính năng này.", "warning");
            return;
        }

        if (!productId) {
            showToast("❌ Không tìm thấy sản phẩm.", "error");
            return;
        }

        // Nếu đã có trong danh sách → xóa
        if (wishlistBtn.dataset.inWishlist) {
            const wishlistId = wishlistBtn.dataset.inWishlist;
            const res = await fetch(`http://localhost:3001/api/wishlist/${wishlistId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                heartIcon.classList.remove("text-danger");
                delete wishlistBtn.dataset.inWishlist;
                showToast("Đã xóa khỏi danh sách yêu thích.", "info");
            } else {
                showToast("Xóa thất bại!", "error");
            }
        } else {
            // Nếu chưa có → thêm mới
            const res = await fetch("http://localhost:3001/api/wishlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId, productId })
            });

            const result = await res.json();
            if (res.ok) {
                heartIcon.classList.add("text-danger");
                wishlistBtn.dataset.inWishlist = result.data._id;
                showToast("Đã thêm vào danh sách yêu thích!", "success");
            } else {
                showToast(result.message || "Thêm vào wishlist thất bại.", "error");
            }
        }
    });
});
function showToast(message, type = "success") {
    Toastify({
        text: message,
        duration: 1700,
        gravity: "top", // hoặc "bottom"
        position: "right",
        backgroundColor: type === "success" ? "#16a34a"
            : type === "info" ? "#3b82f6"
            : type === "error" ? "#dc2626"
            : "#444",
        stopOnFocus: true
    }).showToast();
}
