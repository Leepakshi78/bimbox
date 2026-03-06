import { api } from "../services/api";
export const getAllUsers = () => api.get("/api/admin/users");
export const deleteUserById = (id) => api.delete(`/api/admin/users/${id}`);
export const updateUserRole = (id, role) => api.patch(`/api/admin/users/${id}/role`, { role });
export const updateUserStatus = (id, status, reason) => api.patch(`/api/admin/users/${id}/status`, { status, reason });