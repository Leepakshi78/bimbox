// js/login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("message");
  msg.textContent = "";

  try {
    const data = await api("/login", "POST", { email, password });

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    if (data.token) localStorage.setItem("token", data.token);

    // if backend sends verified status
    if (data.isVerified !== undefined) {
      localStorage.setItem("isVerified", String(data.isVerified));
    }

    // if not verified, go verify
    if (localStorage.getItem("isVerified") === "false") {
      window.location.href = "verify.html";
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    msg.textContent = err.message;
  }
});
