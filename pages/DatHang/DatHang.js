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

    localStorage.setItem("final_total", totalAmount); // ✅ lưu lại để cộng ship

    updateTotalAmountWithShipping(); // ✅ luôn tính lại tổng sau khi render
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
        alert("Lỗi khi tải danh sách phương thức vận chuyển.");
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
        alert("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
        return;
    }

    const formData = new FormData(form);
    const token = localStorage.getItem("token");

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
        totalAmount: parseInt(localStorage.getItem("final_total_with_shipping")) || 0 // Tổng số tiền sau khi cộng phí vận chuyển
    };

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
            alert("Đặt hàng thất bại. Mã lỗi: " + response.status);
            return;
        }

        const result = await response.json();
        alert(result.message || "Đặt hàng thành công");

        localStorage.removeItem("cart");
        updateCartCount();
        renderCart();
        //Xoá cart theo ID
        localStorage.removeItem(`cart_${localStorage.getItem("userId")}`);

        window.location.href = "/pages/MyLearning/ThankYou.html";  
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        alert("Đã xảy ra lỗi khi đặt hàng.");
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