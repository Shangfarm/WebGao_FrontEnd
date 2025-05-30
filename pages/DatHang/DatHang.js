const itemsContainer = document.getElementById("items-container");
const totalAmountEl = document.getElementById("total-amount");
const form = document.getElementById("checkout-form");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
function renderCart() {
    itemsContainer.innerHTML = "";
    let totalAmount = 0;

    if (cart.length === 0) {
        itemsContainer.innerHTML = "<p>Không có sản phẩm trong giỏ hàng.</p>";
        return;
    }

    cart.forEach((item, index) => {
        const discount = item.discount || 0;
        const discountedPrice = item.price * (1 - discount / 100);
        const itemTotal = discountedPrice * item.quantity;
        totalAmount += itemTotal;

        const div = document.createElement("div");
        div.className = "mb-2 border p-2 rounded bg-white";
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.name}</strong><br />
                    SL: ${item.quantity} | Đơn giá: ${item.price.toLocaleString()}đ | Giảm: ${discount}%<br />
                    Thành tiền: <strong>${itemTotal.toLocaleString()}đ</strong>
                    <input type="hidden" name="items[]" value='${JSON.stringify(item)}' />
                </div>
                <button class="btn btn-sm btn-danger" data-index="${index}">Xóa</button>
            </div>
        `;
        itemsContainer.appendChild(div);
    });

    localStorage.setItem("final_total", totalAmount);

    updateTotalAmountWithShipping();
    addRemoveEvents();
}

function addRemoveEvents() {
    document.querySelectorAll("button[data-index]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
            updateCartCount();
        });
    });
}

function updateTotalAmountWithShipping() {
    console.log("finalTotal từ giỏ hàng:", localStorage.getItem("finalTotal"));
    const selectedOption = document.querySelector("#shippingMethodId option:checked");
    const shippingPrice = selectedOption ? parseInt(selectedOption.getAttribute("data-price")) || 0 : 0;
    console.log("Phí vận chuyển:", shippingPrice);

    const finalFromCart = parseInt(localStorage.getItem("finalTotal")) || 0;
    const finalTotal = finalFromCart + shippingPrice;

    localStorage.setItem("final_total_with_shipping", finalTotal);

    const totalAmountEl = document.getElementById("total-amount");
    totalAmountEl.innerText = `Tổng tiền: ${finalTotal.toLocaleString()}đ (gồm ${shippingPrice.toLocaleString()}đ phí vận chuyển)`;
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.getElementById("cart-count");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCountEl) {
        if (totalItems > 0) {
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = "inline-block";
        } else {
            cartCountEl.style.display = "none";
        }
    }
}

async function loadShippingMethods() {
    const selectEl = document.getElementById("shippingMethodId");
    const token = localStorage.getItem("token");

    try {
        const res = await fetch("http://localhost:3001/api/shipping-methods", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const { data } = await res.json();

        data.forEach(method => {
            const option = document.createElement("option");
            option.value = method._id;
            option.setAttribute("data-price", method.price);
            option.textContent = `${method.name} - ${method.price.toLocaleString()}đ (trong vòng ${method.estimatedDeliveryTime})`;
            selectEl.appendChild(option);
        });

        selectEl.addEventListener("change", updateTotalAmountWithShipping);
    } catch (err) {
        console.error("Không thể load phương thức vận chuyển:", err);
        showToast("Lỗi khi tải danh sách phương thức vận chuyển.", "error");
    }
}

async function syncCartToBackend(userId) {
    const token = localStorage.getItem("token");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    for (const item of cart) {
        try {
            await fetch("http://localhost:3001/api/cart-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    productId: item.id || item.productId,
                    quantity: item.quantity
                })
            });
        } catch (err) {
            console.error("Lỗi khi sync giỏ hàng:", err);
        }
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Kiểm tra xem giỏ hàng có sản phẩm không
    if (cart.length === 0) {
        showToast("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.", "warning");
        return;
    }

    const formData = new FormData(form);
    const token = localStorage.getItem("token");

    let promotionId = localStorage.getItem("selectedPromotionId");
    if (!promotionId || promotionId === "null" || promotionId === "" || promotionId === undefined) {
    promotionId = null;
    localStorage.removeItem("selectedPromotionId");
    localStorage.removeItem("selectedPromotionName");
}

    const order = {
        userId: formData.get("userId"),
        userName: formData.get("userName"),
        shippingAddress: {
            houseNumber: formData.get("shippingAddress.houseNumber"),
            ward: formData.get("shippingAddress.ward"),
            district: formData.get("shippingAddress.district"),
            city: formData.get("shippingAddress.city"),
            phoneNumber: formData.get("shippingAddress.phoneNumber"),
        },
        shippingMethodId: formData.get("shippingMethodId"),
        paymentMethod: formData.get("paymentMethod"),
        couponId: formData.get("couponId") || null,
        //promotionId: promotionId,
        totalAmount: parseInt(localStorage.getItem("final_total_with_shipping")) || 0, // Tổng số tiền sau khi cộng phí vận chuyển
        items: cart.map(item => ({
        productId: item.id || item.productId,
        quantity: item.quantity,
        price: item.price
    }))
    };
    if (promotionId) {
    order.promotionId = promotionId;
}

    try {
        // Đồng bộ giỏ hàng với backend
        await syncCartToBackend(order.userId);

        const response = await fetch("http://localhost:3001/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(order),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lỗi từ backend:", errorText);
            showToast("Đặt hàng thất bại. Mã lỗi: " + response.status, "error");
            return;
        }

        const result = await response.json();
        Swal.fire({
            icon: 'success',
            title: 'Đặt hàng thành công!',
            text: 'Cảm ơn bạn đã mua hàng tại FamRice.',
            showConfirmButton: false,
            timer: 1800, // Tự động đóng sau 1.8s
            customClass: {
            title: 'fs-2', // chữ lớn hơn (tuỳ css)
            popup: 'swal2-popup-custom' // (nếu muốn thêm style riêng)
            }
        }).then(() => {
            window.location.href = `/pages/ThanhToan/ThanhToan.html?orderId=${result.data._id}`;
        });
        localStorage.removeItem("cart");
        localStorage.removeItem("selectedPromotionId");
        localStorage.removeItem("selectedPromotionName");
        updateCartCount();
        renderCart();
        localStorage.removeItem(`cart_${localStorage.getItem("userId")}`);
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        showToast("Đã xảy ra lỗi khi đặt hàng.", "error");
    }
});

function setupSearchToggle() {
    const searchToggle = document.querySelector(".search-toggle");
    const searchBox = document.getElementById("search-box");

    if (searchToggle && searchBox) {
        searchToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            searchBox.classList.toggle("d-none");
        });

        document.addEventListener("click", (e) => {
            if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
                searchBox.classList.add("d-none");
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    updateCartCount();
    loadShippingMethods();
    setupSearchToggle();

    const promoName = localStorage.getItem("selectedPromotionName");
    if (promoName) {
    const promoTextEl = document.getElementById("promotion-applied");
    promoTextEl.textContent = `Đã áp dụng khuyến mãi: ${promoName}`;
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
    e.preventDefault(); // Không reload
    const keyword = document.getElementById("search-input").value.trim();

    if (keyword) {
        window.location.href = `/pages/SanPham/SanPham.html?search=${encodeURIComponent(keyword)}`;
    }
});
function showToast(message, type = "info") {
    let bg = "#198754";
    if (type === "error") bg = "#dc3545";
    if (type === "warning") bg = "#ffc107";
    if (type === "success") bg = "#28a745";
    Toastify({
        text: message,
        duration: 2500,
        close: true,
        gravity: "top",
        position: "right",
        style: { background: bg, color: "#fff" }
    }).showToast();
}
