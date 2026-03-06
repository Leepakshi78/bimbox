// src/Pages/login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/api/user/login", {
        email: email.trim(),
        password,
      });

      // If backend says admin must reset first password
      if (res.data?.mustChangePassword) {
        localStorage.setItem("firstResetToken", res.data.resetToken);
        navigate("/reset-password", { replace: true });
        return;
      }

      // Store token
      const token = res.data?.token;
      if (token) localStorage.setItem("token", token);

      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";

      // Too many attempts (rate limiter)
      if (status === 429) {
        setMsg("Too many login attempts. Try again after 15 minutes.");
        return;
      }

      // Account locked
      if (status === 423) {
        setMsg(
          "Account locked due to multiple failed attempts. Try again later."
        );
        return;
      }

      // Wrong credentials
      if (status === 401) {
        setMsg("Invalid email or password.");
        return;
      }

      // Not verified
      if (
        status === 403 &&
        String(backendMsg).toLowerCase().includes("verify")
      ) {
        setMsg(backendMsg);
        navigate("/verify-otp", { replace: true });
        return;
      }

      // Fallback
      setMsg(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Login</h1>
        <p className="authSub">Access your dashboard</p>

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
              autoComplete="email"
              required
            />
          </label>

          <label className="authLabel">
            Password
            <input
              className="authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="authBtn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="authLinkRow">
            <span>
              New user?{" "}
              <Link className="authLink" to="/register">
                Register
              </Link>
            </span>

            <Link className="authLink" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}