const apiUrl = "http://localhost:3001/api/auth/forgot-password";

document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ✅ Kiểm tra nếu người dùng chưa nhập email
    // ✅ Nếu không nhập gì
  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "Hãy điền thông tin đầy đủ nhé!",
      text: "Trường email không được để trống.",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }
  
  // Kiểm tra rỗng
  if (!email) {
    Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin!",
      text: "Vui lòng nhập địa chỉ email.",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }

  // Kiểm tra định dạng không hợp lệ
  if (!emailRegex.test(email)) {
    Swal.fire({
      icon: "warning",
      title: "Email không hợp lệ!",
      text: "Vui lòng nhập địa chỉ email hợp lệ.",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }


  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
// ✅ Thành công - hiển thị popup đẹp
    Swal.fire({
      icon: 'success',
      title: 'Gửi thành công!',
      text: 'Vui lòng kiểm tra email để đặt lại mật khẩu.',
      confirmButtonColor: '#3085d6'
    }).then(() => {
      window.location.href = "/pages/DangNhap/DangNhap.html";
    });
    
  } catch (err) {
    // ❌ Lỗi - hiển thị popup đẹp
    Swal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: err.message,
      confirmButtonColor: '#d33'
    });
  }
});
