const form = document.getElementById("resetForm");
const message = document.getElementById("message");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value;

  if (newPassword.length < 4) {
    message.innerText = "Password too short";
    return;
  }

  localStorage.setItem("userPassword", newPassword);

  message.innerText = "Password reset successful";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
});
