// src/Pages/forgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.post("/api/user/forgotpassword", { email: email.trim() });
      setMsg("OTP sent. Verify and reset password now.");
      navigate("/reset-password", { replace: true, state: { email: email.trim() } });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Forgot Password</h1>
        <p className="authSub">We will send OTP to your email</p>

        {msg && <div className="authAlert">{msg}</div>}

        <form className="authForm" onSubmit={sendOtp}>
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

          <button className="authBtn" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <div className="authLinkRow">
            <Link className="authLink" to="/login">Back to Login</Link>
            <Link className="authLink" to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}