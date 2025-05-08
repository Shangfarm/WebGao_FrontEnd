document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const profileForm = document.querySelector(".profile-form");

    // Ẩn form lúc đầu
    profileForm.style.display = "none";

    if (!token) {
        alert("Bạn chưa đăng nhập!");
        return;
    }

    try {
        const res = await fetch("http://localhost:3001/api/users/me", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Token hết hạn hoặc không hợp lệ");

        const data = await res.json();

        // Hiện form nếu token hợp lệ
        profileForm.style.display = "block";

        // Gán thông tin người dùng
        document.getElementById("fullname").value = data.fullName || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phoneNumber").value = data.phoneNumber || "";
        document.getElementById("avatar-preview").src = data.avatar || "";
    } catch (err) {
        console.error("Lỗi xác thực:", err);
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        window.location.href = "/pages/DangNhap/DangNhap.html";
        return;
    }

    // Preview ảnh
    let avatarBase64 = "";
    document.getElementById("avatar").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            avatarBase64 = event.target.result;
            document.getElementById("avatar-preview").src = avatarBase64;
        };
        reader.readAsDataURL(file);
    });

    // Submit cập nhật
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullname").value;
        const email = document.getElementById("email").value;
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const avatar = avatarBase64 || document.getElementById("avatar-preview").src;

        try {
            const res = await fetch("http://localhost:3001/api/users/update-me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ fullName, email, phoneNumber, avatar })
            });

            const result = await res.json();

            if (res.ok) {
                alert("✅ Cập nhật thành công!");
            } else {
                alert("❌ Cập nhật thất bại: " + result.message);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            alert("❌ Đã xảy ra lỗi khi gửi yêu cầu cập nhật");
        }
    });

    // Xử lý đăng xuất
    const loginLink = document.getElementById("login-link");
    if (loginLink && token) {
        loginLink.textContent = "ĐĂNG XUẤT";
        loginLink.href = "#";
        loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("Bạn đã đăng xuất thành công!");
            location.reload();
        });
    }
});
