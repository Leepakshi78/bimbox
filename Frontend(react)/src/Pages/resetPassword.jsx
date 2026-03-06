// src/Pages/resetPassword.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const stEmail = location?.state?.email;
    if (stEmail) setEmail(stEmail);
  }, [location]);

  const verifyResetOtp = async () => {
    setMsg("");
    setLoading(true);
    try {
      await api.post("/api/user/verifyresetotp", {
        email: email.trim(),
        otp,
      });
      setMsg("OTP verified. Now reset password.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendResetOtp = async () => {
    setMsg("");
    setLoading(true);
    try {
      await api.post("/api/user/forgotpassword", { email: email.trim() });
      setMsg("OTP resent to your email.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setMsg("");

    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // IMPORTANT: backend requires otp here
      await api.post("/api/user/resetpassword", {
        email: email.trim(),
        otp,
        newPassword,
      });

      setMsg("Password updated. Login now.");
      navigate("/login", { replace: true });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Reset Password</h1>
        <p className="authSub">Verify OTP then set a new password</p>

        {msg && <div className="authAlert">{msg}</div>}

        <form className="authForm" onSubmit={reset}>
          <label className="authLabel">
            Email
            <input
              className="authInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <div className="otpRow">
            <label className="authLabel">
              OTP
              <input
                className="authInput"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6 digit OTP"
                inputMode="numeric"
                required
              />
            </label>

            <button
              type="button"
              className="smallBtn"
              onClick={verifyResetOtp}
              disabled={loading || !email.trim() || otp.length !== 6}
            >
              Verify OTP
            </button>
          </div>

          <label className="authLabel">
            New Password
            <input
              className="authInput"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Min 8 characters"
              required
            />
          </label>

          <label className="authLabel">
            Confirm Password
            <input
              className="authInput"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Re-enter new password"
              required
            />
          </label>

          <button className="authBtn" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>

          <div className="authLinkRow">
            <button
              type="button"
              className="smallBtn"
              onClick={resendResetOtp}
              disabled={loading || !email.trim()}
            >
              Resend OTP
            </button>

            <Link className="authLink" to="/login">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}