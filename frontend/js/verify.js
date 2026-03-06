const verifyBtn = document.getElementById("verifyBtn");

verifyBtn.addEventListener("click", async () => {
  const otp = document.getElementById("otp").value;
  const message = document.getElementById("message");

  if (!otp) {
    message.textContent = "Enter OTP first";
    return;
  }

  try {
    const res = await api.post("/user/verifyotp", { otp });
    message.textContent = "Verified successfully ";
  } catch (err) {
    message.textContent =
      err.response?.data?.message || "OTP verification failed";
  }
});
