window.onload = function () {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const tbody = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Giỏ hàng trống.</td></tr>';
        totalEl.innerText = "0 đ";
        return;
    }

    let total = 0;
    tbody.innerHTML = cart
        .map((item, index) => {
            const discount = item.discount || 0;
            const itemTotal = item.price * item.quantity * (1 - discount / 100);
            total += itemTotal;
            return `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} đ</td>
                <td>${discount}%</td>
                <td>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${index}, -1)">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                </td>
                <td>${itemTotal.toLocaleString()} đ</td>
                <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Xóa</button></td>
            </tr>
            `;      
        })
        .join("");

    // MÃ GIẢM GIÁ TOÀN GIỎ
    const discountInput = document.getElementById("discount");

    function updateTotalWithDiscount() {
        let discount = parseInt(discountInput.value) || 0;

        // Giới hạn từ 0 → 100
        if (discount < 0) discount = 0;
        if (discount > 100) discount = 100;
        discountInput.value = discount;

        const finalTotal = total * (1 - discount / 100);
        totalEl.innerText = finalTotal.toLocaleString() + " đ";
    }

    discountInput.addEventListener("keypress", (e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char)) e.preventDefault();
    });

    discountInput.addEventListener("input", updateTotalWithDiscount);
    updateTotalWithDiscount();

    // ✅ xử lý nút thanh toán
    document.querySelector(".btn-success").addEventListener("click", function () {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ Vui lòng đăng nhập trước khi thanh toán.");
            window.location.href = "/pages/DangNhap/DangNhap.html";
            return;
        }

        alert("✅ Xử lý thanh toán thành công (giả lập)");
        localStorage.removeItem("cart");
        window.location.href = "/pages/MyLearning/ThankYou.html";
    });
};

function changeQuantity(index, delta) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (!cart[index]) return;

    const maxStock = cart[index].stock || 1000; // fallback nếu chưa có stock
    cart[index].quantity += delta;

    if (cart[index].quantity < 1) {
        cart[index].quantity = 1;
    } else if (cart[index].quantity > maxStock) {
        cart[index].quantity = maxStock;
        alert(`⚠️ Số lượng tồn kho không đủ để tăng thêm sản phẩm.`);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.reload();
}



function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.reload();
}

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

document.getElementById("clear-cart-btn")?.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
        localStorage.removeItem("cart");
        location.reload();
    }
});
