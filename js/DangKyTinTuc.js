document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-dang-ky-tin-tuc");
  const emailInput = document.getElementById("email-dang-ky");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        Swal.fire({
          icon: 'warning',
          title: 'Thiếu thông tin!',
          text: 'Vui lòng nhập email.',
          confirmButtonColor: '#fb811e'
        });
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/newsletter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: '🎉 Bạn đã đăng ký nhận tin thành công!',
            confirmButtonColor: '#fb811e'
          });
          form.reset();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Thất bại!',
            text: result.message || 'Đăng ký không thành công. Vui lòng thử lại.',
            confirmButtonColor: '#fb811e'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi kết nối!',
          text: '❌ Không thể gửi yêu cầu. Vui lòng thử lại sau.',
          confirmButtonColor: '#fb811e'
        });
      }
    });
  }
});
