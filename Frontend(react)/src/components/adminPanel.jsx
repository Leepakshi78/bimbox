// src/components/adminPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createSocket } from "../socket";
import { api } from "../services/api";
import "./adminPanel.css";

export default function AdminPanel() {
  // -----------------------------
  // Common UI State
  // -----------------------------
  const [loading, setLoading] = useState(true); // overall page loading
  const [errorMsg, setErrorMsg] = useState(""); // error banner text

  // -----------------------------
  // Maintenance State
  // -----------------------------
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false); // ON/OFF
  const [maintenanceLoading, setMaintenanceLoading] = useState(false); // toggle button loading

  // -----------------------------
  // Users State
  // -----------------------------
  const [users, setUsers] = useState([]); // all users list
  const [usersLoading, setUsersLoading] = useState(false); // user update loading

  // -----------------------------
  // Live Presence State (Socket + Redis)
  // presenceMap structure:
  // {
  //   "<userId>": { status: "Online" | "Offline" | "Idle" | "Busy", lastSeen: <timestamp> }
  // }
  // -----------------------------
  const [presenceMap, setPresenceMap] = useState({});

  // Keep socket instance stable for cleanup and future actions (optional)
  const socketRef = useRef(null);

  // -----------------------------
  // Sort users: Admin first, then by email
  // useMemo avoids re-sorting on every render unless "users" changes
  // -----------------------------
  const sortedUsers = useMemo(() => {
    const arr = Array.isArray(users) ? [...users] : [];

    // Keep admins on top, then by email
    arr.sort((a, b) => {
      const ra = (a.role || "").toLowerCase();
      const rb = (b.role || "").toLowerCase();

      // if roles are different, admin comes first
      if (ra !== rb) return ra === "admin" ? -1 : 1;

      // if roles same, sort by email
      return String(a.email || "").localeCompare(String(b.email || ""));
    });

    return arr;
  }, [users]);

  // ============================================================
  // Helper: Extract maintenance enabled flag from various backend shapes
  // Because different backends may return:
  // 1) { enabled: true }
  // 2) { maintenanceEnabled: true }
  // 3) { data: { enabled: true } }
  // 4) { data: { maintenanceMode: true } }
  // ============================================================
  const parseMaintenanceEnabled = (res) => {
    const enabled =
      res?.data?.enabled ??
      res?.data?.maintenanceEnabled ??
      res?.data?.data?.enabled ??
      res?.data?.data?.maintenanceEnabled ??
      res?.data?.data?.maintenanceMode ??
      false;

    return Boolean(enabled);
  };

  // ============================================================
  // GET Maintenance Status
  // Expected: GET /api/system/maintenance
  // ============================================================
  const fetchMaintenance = async () => {
    const res = await api.get("/api/system/maintenance");
    setMaintenanceEnabled(parseMaintenanceEnabled(res));
  };

  // ============================================================
  // GET Users
  // Expected: GET /api/admin/users -> { success:true, users:[...] }
  // ============================================================
  const fetchUsers = async () => {
    const res = await api.get("/api/admin/users");
    const list = res.data?.users ?? res.data?.data?.users ?? [];
    setUsers(Array.isArray(list) ? list : []);
  };

  // ============================================================
  // Initialize page: fetch maintenance + users in parallel
  // ============================================================
  const init = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await Promise.all([fetchMaintenance(), fetchUsers()]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load admin data";

      setErrorMsg(msg);

      // If token invalid, force logout and redirect to login
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  // Load once on component mount
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // SOCKET: Admin listens for live presence updates
  //
  // Backend emits:
  // io.emit("presence_update", { userId, presence })
  //
  // Admin stores this in presenceMap[userId] = presence
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token); 
    if (!token) return;

    // Create socket connection for Admin page
    const socket = createSocket(token);
    socketRef.current = socket;
//debug listener  
    socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });
    
     socket.on("connect_error", (err) => {
    console.log("Socket connection error:", err.message);
  });


    // Listen for presence updates
    socket.on("presence_update", ({ userId, presence }) => {
      if (!userId) return;
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: presence,
      }));
    });

    // If admin gets forceLogout (rare, but possible), handle cleanly
    socket.on("forceLogout", ({ reason } = {}) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert(reason || "You have been logged out.");
      window.location.href = "/login";
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ============================================================
  // PATCH Maintenance Toggle
  // Expected: PATCH /api/system/maintenance { enabled: boolean }
  // ============================================================
  const updateMaintenance = async (nextValue) => {
    setMaintenanceLoading(true);
    setErrorMsg("");

    try {
      const res = await api.patch("/api/system/maintenance", {
        enabled: nextValue,
      });

      const enabledFromRes = parseMaintenanceEnabled(res);
      setMaintenanceEnabled(
        typeof enabledFromRes === "boolean" ? enabledFromRes : Boolean(nextValue)
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update maintenance mode";
      setErrorMsg(msg);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // ============================================================
  // PATCH User Status Change
  // Expected: PATCH /api/admin/users/:id/status
  // ============================================================
  const changeUserStatus = async (userId, newStatus) => {
    setUsersLoading(true);
    setErrorMsg("");

    try {
      const res = await api.patch(`/api/admin/users/${userId}/status`, {
        status: newStatus,
      });

      const updated = res.data?.user ?? res.data?.data?.user;

      // If backend doesn't return updated user, just refetch list
      if (!updated?._id) {
        await fetchUsers();
        return;
      }

      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user status";
      setErrorMsg(msg);
    } finally {
      setUsersLoading(false);
    }
  };

  // -----------------------------
  // UI helpers: badge class names
  // -----------------------------
  const statusBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "active") return "badge badge--green";
    if (s === "suspended") return "badge badge--yellow";
    return "badge badge--red";
  };

  const roleBadgeClass = (role) => {
    const r = String(role || "").toLowerCase();
    if (r === "admin") return "badge badge--purple";
    return "badge badge--blue";
  };

  // Presence badge helper (falls back to Offline when no presence data)
  const getPresence = (userId) => {
    const p = presenceMap?.[userId];
    // If we haven't received any presence_update yet for this user,
    // treat them as Offline in UI.
    return p?.status || "Offline";
  };

  const presenceBadgeClass = (presenceStatus) => {
    const s = String(presenceStatus || "").toLowerCase();
    if (s === "online") return "badge badge--green";
    if (s === "idle") return "badge badge--yellow";
    if (s === "busy") return "badge badge--blue";
    return "badge badge--red"; // Offline / unknown
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="adminWrap">
      <div className="adminCard">
        {/* Header */}
        <div className="adminHeader">
          <div>
            <h2 className="adminTitle">Admin Panel</h2>
            <p className="adminSubtitle">Maintenance + User Status Management</p>
          </div>

          <button className="btn btn--ghost" onClick={() => init()}>
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="alert alert--danger">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* Loading vs Content */}
        {loading ? (
          <div className="loadingBox">
            <div className="spinner" />
            <p>Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* =========================
                Maintenance Section
               ========================= */}
            <section className="section">
              <div className="sectionHead">
                <h3 className="sectionTitle">Maintenance Mode</h3>
                <p className="sectionHint">
                  When enabled, only Admin can use the system.
                </p>
              </div>

              <div className="maintenanceRow">
                <div className="maintenanceState">
                  <span
                    className={
                      maintenanceEnabled
                        ? "badge badge--red"
                        : "badge badge--green"
                    }
                  >
                    {maintenanceEnabled ? "ENABLED" : "DISABLED"}
                  </span>

                  <span className="maintenanceText">
                    {maintenanceEnabled
                      ? "Users are blocked (maintenance active)."
                      : "System is live for users."}
                  </span>
                </div>

                <button
                  className="btn btn--primary"
                  disabled={maintenanceLoading}
                  onClick={() => updateMaintenance(!maintenanceEnabled)}
                >
                  {maintenanceLoading
                    ? "Updating..."
                    : maintenanceEnabled
                    ? "Disable Maintenance"
                    : "Enable Maintenance"}
                </button>
              </div>
            </section>

            {/* =========================
                Users Section
               ========================= */}
            <section className="section">
              <div className="sectionHead">
                <h3 className="sectionTitle">All Users</h3>
                <p className="sectionHint">
                  Change user status to control access (Active / Suspended /
                  Deactivated).
                </p>
              </div>

              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Presence</th>
                      <th>Change Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="emptyCell">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      sortedUsers.map((u) => {
                        const presence = getPresence(u._id);
                        return (
                          <tr key={u._id}>
                            <td className="mono">{u.email}</td>

                            <td>
                              <span className={roleBadgeClass(u.role)}>
                                {u.role || "user"}
                              </span>
                            </td>

                            <td>
                              <span className={statusBadgeClass(u.status)}>
                                {u.status || "Unknown"}
                              </span>
                            </td>

                            {/* Live Presence badge */}
                            <td>
                              <span className={presenceBadgeClass(presence)}>
                                {presence}
                              </span>
                            </td>

                        <td>
                       <div className="actionsRow">
                        <select
                          className="select"
                          value={u.status || "Active"}
                          onChange={(e) =>
                            changeUserStatus(u._id, e.target.value)
                          }
                          disabled={usersLoading}
                        >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>

                      <button
                              className="btn btn--danger"
                              onClick={() => {
                                console.log("Force logout clicked for:", u._id);

                                socketRef.current?.emit("admin_force_disconnect", {
                                  targetUserId: u._id,
                                });
                              }}
                            >
                              Force Logout
                            </button>
                         </div>
                         </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {usersLoading && (
                  <div className="miniHint">Updating users...</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}


//useMemo -> is a react hook it calculate and memorise ,it will recalculate only when the dependecies changes
//here it is sorting the user arrays ,it wont resort when presence table changes ot user status changes ,it will sort again when user changes 