// src/Pages/dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api"; // axios instance
import { createSocket } from "../socket"; // <-- create this file: src/socket.js
import "./dashboard.css";

/*
  DASHBOARD PAGE
  - Renders ONLY dashboard content (Layout.jsx handles navbar/logout)
  - Fetches profile on mount
  - Handles maintenance + auth errors
  - Socket layer:
      - Connects Socket.IO after token is present
      - Sends heartbeat ping every 25s (for idle/online tracking)
      - Listens for forceLogout from server (suspended/deactivated/admin disconnect)
*/

export default function Dashboard() {
  // -----------------------------
  // STATE
  // -----------------------------
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  // Optional UI state: show connection status
  const [socketStatus, setSocketStatus] = useState("Disconnected");

  // Keep socket instance across renders without causing re-renders
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);

  // -----------------------------
  // DERIVED UI
  // -----------------------------
  const avatarLetter = useMemo(() => {
    if (!profile?.email) return "?";
    return profile.email.trim().charAt(0).toUpperCase();
  }, [profile]);

  const roleLabel = profile?.role || "user";
  const statusLabel = profile?.status || "Unknown";

  const statusClass =
    statusLabel.toLowerCase() === "active"
      ? "badge badge--green"
      : statusLabel.toLowerCase() === "suspended"
      ? "badge badge--yellow"
      : "badge badge--red";

  const roleClass =
    roleLabel.toLowerCase() === "admin"
      ? "badge badge--purple"
      : "badge badge--blue";

  // -----------------------------
  // API: Fetch profile
  // -----------------------------
  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg("");
    setMaintenanceMsg("");

    try {
      const res = await api.get("/api/user/profile");
      const user = res.data?.user ?? res.data;
      setProfile(user);
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || "Something went wrong";

      // 503: maintenance mode
      if (status === 503) {
        setMaintenanceMsg(backendMsg || "System under maintenance. Try later.");
        setProfile(null);
        return;
      }

      // 401/403: invalid token or blocked
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      setErrorMsg(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SOCKET: connect + heartbeat + forceLogout
  // -----------------------------
  const connectSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Avoid duplicate connections on re-render
    if (socketRef.current?.connected) return;

    const socket = createSocket(token);
    socketRef.current = socket;

    // Connection status
    socket.on("connect", () => {
      setSocketStatus("Connected");
      // console.log("socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

    socket.on("connect_error", (err) => {
      setSocketStatus("Error");
      // If token is invalid or restricted, server may reject handshake
      // console.log("socket connect_error:", err?.message);
    });

    // Heartbeat: keeps user Online and helps server detect Idle
    heartbeatRef.current = setInterval(() => {
      socket.emit("heartbeat");
    }, 25000);

    // Forced logout from server:
    // - user Suspended/Deactivated while logged in
    // - admin forced disconnect
    socket.on("forceLogout", ({ reason } = {}) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optional: show message (alert is simplest)
      alert(reason || "You have been logged out.");
      window.location.href = "/login";
    });

    // Optional: if you want to view presence updates in console
    // (Admin panel will use this to show live badges)
    socket.on("presence_update", (payload) => {
      // payload = { userId, presence: { status, lastSeen } }
      // console.log("presence_update:", payload);
    });
  };

  const cleanupSocket = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // -----------------------------
  // ON MOUNT: check token, fetch profile, connect socket
  // -----------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchProfile();
    connectSocket();

    // Cleanup on unmount (important to avoid memory leaks)
    return () => {
      cleanupSocket();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <section className="heroCard">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="heroCard__title">Dashboard</h2>
            <p className="heroCard__subtitle">Account Overview</p>
          </div>

          {/* Optional UI indicator for socket connection */}
          <div className="pill" style={{ height: "fit-content" }}>
            Live status: {socketStatus}
          </div>
        </div>

        {/* Maintenance Banner */}
        {maintenanceMsg && (
          <div className="alert alert--warning">
            <strong>Maintenance Mode:</strong> {maintenanceMsg}
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="alert alert--danger">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loadingBox">
            <div className="spinner" />
            <p>Loading your profile...</p>
          </div>
        ) : (
          <div className="grid">
            {/* Profile Card */}
            <div className="card">
              <div className="card__header">
                <div className="avatar">{avatarLetter}</div>
                <div>
                  <h3 className="card__title">Profile Information</h3>
                  <p className="card__hint">Your account identity & access</p>
                </div>
              </div>

              <div className="kv">
                <div className="kv__row">
                  <span className="kv__key">Email</span>
                  <span className="kv__val">{profile?.email || "-"}</span>
                </div>

                <div className="kv__row">
                  <span className="kv__key">Role</span>
                  <span className={roleClass}>{roleLabel}</span>
                </div>

                <div className="kv__row">
                  <span className="kv__key">Status</span>
                  <span className={statusClass}>{statusLabel}</span>
                </div>

                <div className="kv__row">
                  <span className="kv__key">Last Login</span>
                  <span className="kv__val">
                    {profile?.lastLogin
                      ? new Date(profile.lastLogin).toLocaleString()
                      : "—"}
                  </span>
                </div>

                <div className="kv__row">
                  <span className="kv__key">Created At</span>
                  <span className="kv__val">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="card">
              <h3 className="card__title">Security</h3>

              <div className="pill">Token-based authentication enabled.</div>
              <div className="pill">Global error handling active (401 / 403 / 503).</div>
              <div className="pill">Rate limiting enabled for OTP & login (429 protection).</div>
              <div className="pill">Maintenance-mode protection supported.</div>
              <div className="pill">Live presence tracking enabled (Socket + Redis).</div>

              {/* Admin CTA */}
              {roleLabel.toLowerCase() === "admin" && (
                <div className="adminCta">
                  <p className="adminCta__text">
                    You are an <strong>Admin</strong>. You can manage users &
                    maintenance settings.
                  </p>
                  <button
                    className="btn btn--primary"
                    onClick={() => (window.location.href = "/admin")}
                  >
                    Go to Admin Panel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}