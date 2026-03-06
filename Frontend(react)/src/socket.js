import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:6001";

export const createSocket = (token) => {
  const socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  // Debug connection
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  //  FORCE LOGOUT LISTENER
  socket.on("forceLogout", ({ reason }) => {
    alert(reason || "You have been logged out by admin");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  });

  return socket;
};