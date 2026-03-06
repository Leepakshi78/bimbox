// src/Pages/verifyOtp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./auth.css";

export default function VerifyOtp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const verify = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.post("/api/user/verifyotp", { email: email.trim(), otp });
      setMsg("OTP verified. You can login now.");
      navigate("/login", { replace: true });
    } catch (err) {
      setMsg(err?.response?.data?.message || "OTP verify failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setMsg("");
    setLoading(true);
    try {
      await api.post("/api/user/resendotp", { email: email.trim() });
      setMsg("OTP resent to your email.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Verify OTP</h1>
        <p className="authSub">Verify your account</p>

        {msg && <div className="authAlert">{msg}</div>}

        <form className="authForm" onSubmit={verify}>
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
              onClick={resend}
              disabled={loading || !email.trim()}
            >
              Resend OTP
            </button>
          </div>

          <button className="authBtn" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
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