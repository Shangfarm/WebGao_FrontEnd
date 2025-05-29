
let isSignUp = false;

const emailField = document.getElementById("email-field");
const confirmPasswordField = document.getElementById("confirm-password-field");

function toggleForm() {
    isSignUp = !isSignUp;
    document.getElementById("form-title").textContent = isSignUp ? "Đăng ký" : "Đăng nhập";
    document.getElementById("submit-btn").textContent = isSignUp ? "Đăng ký" : "Đăng nhập";
    document.getElementById("side-title").textContent = isSignUp ? "Xin chào bạn mới!" : "Chào mừng trở lại!";
    document.getElementById("side-text").textContent = isSignUp
    ? "Bạn đã có tài khoản?" : "Bạn chưa có tài khoản?";
    document.getElementById("forgot-password-link").style.display = isSignUp ? "none" : "block";
    emailField.style.display = isSignUp ? "block" : "none";
    confirmPasswordField.style.display = isSignUp ? "block" : "none";

    const socialSection = document.getElementById("social-login-section");
    if (socialSection) {
        socialSection.style.display = isSignUp ? "none" : "block";
    }

    document.getElementById("form-section").classList.toggle("slide-right");
    document.getElementById("side-box").classList.toggle("slide-left");
    document.getElementById("toggle-button").innerText = isSignUp ? "Đăng nhập" : "Đăng ký";

}
function isValidEmail(email) {
const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|email\.com)$/;
return emailRegex.test(email);
}

document.getElementById("auth-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    const apiBaseUrl = "http://localhost:3001/api/auth"; // ⚠️ Sửa lại đúng domain nếu bạn deploy

    if (isSignUp) {
        if (!email || !username || !password || !confirmPassword) {
            return Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin!',
                text: 'Vui lòng điền đầy đủ các trường.'
            });
        }

        if (password !== confirmPassword) {
            return Swal.fire({
            icon: 'warning',
            title: 'Mật khẩu không khớp!',
            text: 'Vui lòng kiểm tra lại.'
            });
        }

        // Kiểm tra email hợp lệ
        if (!isValidEmail(email)) {
        document.getElementById("email-error").textContent = "Emai không đúng định dạng ";
        return;
        } else {
        document.getElementById("email-error").textContent = "";
        }

    try {
        const res = await fetch(`${apiBaseUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            username,
            email,
            password,
            fullName: username,
            phoneNumber: "0000000000",
            role: "user"
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");

        Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            text: 'Mời bạn đăng nhập.',
            confirmButtonColor: '#3085d6'
            }).then(() => {
            toggleForm();
            });

        } catch (err) {
            Swal.fire({
            icon: 'error',
            title: 'Lỗi đăng ký!',
            text: err.message
            });
        }

    } else {
        try {
            const res = await fetch(`${apiBaseUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                username: username,    
                email: username, //Sang sửa cái này Nhân nhớ nha, mấy chỗ khác cần sửa luôn
                password
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user._id);
            localStorage.setItem("role", data.user.role);

            localStorage.removeItem("cart");

            // ✅ Gán cart mới tạm thời từ cart_userId nếu có
            const userCartKey = `cart_${data.user._id}`;
            const newCart = localStorage.getItem(userCartKey);
            if (newCart) {
                localStorage.setItem("cart", newCart);
            }
            Swal.fire({
                icon: 'success',
                title: 'Đăng nhập thành công!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.href = "/pages/TrangChu/home.html";
            });
        } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi đăng nhập!',
                    text: err.message
                });
            }
        }
    });

    // Khởi tạo ban đầu
    emailField.style.display = "none";
    confirmPasswordField.style.display = "none";
