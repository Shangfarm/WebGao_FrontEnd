
let isSignUp = false;

const emailField = document.getElementById("email-field");
const confirmPasswordField = document.getElementById("confirm-password-field");

function toggleForm() {
    isSignUp = !isSignUp;
    document.getElementById("form-title").textContent = isSignUp ? "Register" : "Login";
    document.getElementById("submit-btn").textContent = isSignUp ? "Sign Up" : "Sign In";
    document.getElementById("side-title").textContent = isSignUp ? "Hello, Friend!" : "Welcome Back!";
    document.getElementById("side-text").textContent = isSignUp
        ? "Already have an account?" : "Don't have an account?";

    emailField.style.display = isSignUp ? "block" : "none";
    confirmPasswordField.style.display = isSignUp ? "block" : "none";

    const socialSection = document.getElementById("social-login-section");
    if (socialSection) {
        socialSection.style.display = isSignUp ? "none" : "block";
    }

    document.getElementById("form-section").classList.toggle("slide-right");
    document.getElementById("side-box").classList.toggle("slide-left");
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
        return alert("Vui lòng điền đầy đủ thông tin.");
        }
        if (password !== confirmPassword) {
        return alert("Mật khẩu không khớp.");
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

        alert("Đăng ký thành công. Mời bạn đăng nhập.");
        toggleForm();
        } catch (err) {
        alert("Lỗi: " + err.message);
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

        alert("Đăng nhập thành công!");
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
        window.location.href = "/pages/TrangChu/home.html";
        } catch (err) {
        alert("Lỗi: " + err.message);
        }
    }
    });

    emailField.style.display = "none";
    confirmPasswordField.style.display = "none";
