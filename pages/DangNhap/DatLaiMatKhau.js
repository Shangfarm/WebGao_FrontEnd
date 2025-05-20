const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");
const apiUrl = "http://localhost:3001/api/auth/reset-password";

const passwordInput = document.getElementById("new-password");
const strengthText = document.getElementById("password-strength");

// Hàm kiểm tra độ mạnh mật khẩu
function checkPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[\W]/.test(password)) strength++;

  if (strength <= 2) {
    strengthText.textContent = "Mật khẩu yếu";
    strengthText.style.color = "red";
  } else if (strength <= 4) {
    strengthText.textContent = "Mật khẩu trung bình";
    strengthText.style.color = "orange";
  } else {
    strengthText.textContent = "Mật khẩu mạnh";
    strengthText.style.color = "green";
  }
}

// Theo dõi khi gõ mật khẩu
passwordInput.addEventListener("input", () => {
  checkPasswordStrength(passwordInput.value);
});

// Gửi API reset mật khẩu
document.getElementById("reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newPassword = passwordInput.value.trim();  // ⚠️ dùng trim() để tránh khoảng trắng
   // ✅ Kiểm tra nếu người dùng chưa nhập
  if (!newPassword) {
    Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin!",
      text: "Vui lòng nhập mật khẩu mới.",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

// ✅ Thành công
    Swal.fire({
      icon: 'success',
      title: 'Đổi mật khẩu thành công!',
      text: 'Bạn sẽ được chuyển về trang đăng nhập.',
      showConfirmButton: false,
      timer: 2500
    }).then(() => {
      window.location.href = "/pages/DangNhap/DangNhap.html";
    });

  } catch (err) {
    // ❌ Lỗi
    Swal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: err.message,
      confirmButtonColor: '#d33'
    });
  }
});

// 👁️ Toggle hiển thị mật khẩu
const toggleBtn = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");

toggleBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  eyeIcon.classList.toggle("fa-eye");
  eyeIcon.classList.toggle("fa-eye-slash");
});
