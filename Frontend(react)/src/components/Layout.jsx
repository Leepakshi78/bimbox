import { Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Top Navbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 24px",
          background: "#0b1220",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          color: "white",
        }}
      >
        <h2 style={{ margin: 0 }}>DevAuth System</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: "#ef4444",
            color: "white",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>

      {/* IMPORTANT: This renders the current page (dashboard/admin/etc) */}
      <div style={{ padding: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}