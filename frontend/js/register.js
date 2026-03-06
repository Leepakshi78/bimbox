// js/register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("message");
  msg.textContent = "";

  try {
    await api("/register", "POST", { email, password });

    localStorage.setItem("userEmail", email);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("isVerified", "false");

    window.location.href = "verify.html";
  } catch (err) {
    msg.textContent = err.message;
  }
});
