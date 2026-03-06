// js/dashboard.js
const email = localStorage.getItem("userEmail");
const isLoggedIn = localStorage.getItem("isLoggedIn");
const isVerified = localStorage.getItem("isVerified");

if (!isLoggedIn || !email) {
  window.location.href = "login.html";
}

document.getElementById("userEmail").innerText = "Logged in as: " + email;

const messageEl = document.getElementById("message");
const verifyBtn = document.getElementById("verifyBtn");

// Optional: validate token by calling profile
(async () => {
  try {
    await api("/profile", "GET");
  } catch {
    localStorage.clear();
    window.location.href = "login.html";
  }
})();

// Verified UI
if (isVerified === "true") {
  messageEl.innerText = "✔ Email verified";
  messageEl.style.color = "green";

  verifyBtn.innerText = "Email Verified";
  verifyBtn.disabled = true;
  verifyBtn.style.opacity = "0.6";
  verifyBtn.style.cursor = "not-allowed";
}

verifyBtn.addEventListener("click", () => {
  window.location.href = "verify.html";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  window.location.href = "reset.html";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});
