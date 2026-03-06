// src/Pages/register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.post("/api/user/register", {
        email: email.trim(),
        password,
      });

      setMsg("Registered. OTP sent to your email.");
      navigate("/verify-otp", { replace: true });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Register</h1>
        <p className="authSub">Create account and verify OTP</p>

        {msg && <div className="authAlert">{msg}</div>}

        <form className="authForm" onSubmit={submit}>
          <label className="authLabel">
            Email
            <input
              className="authInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />
          </label>

          <label className="authLabel">
            Password
            <input
              className="authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              type="password"
              required
            />
          </label>

          <button className="authBtn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="authLinkRow">
            <span>
              Already have account? <Link className="authLink" to="/login">Login</Link>
            </span>
            <Link className="authLink" to="/verify-otp">Verify OTP</Link>
          </div>
        </form>
      </div>
    </div>
  );
}