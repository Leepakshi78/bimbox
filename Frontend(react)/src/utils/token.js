// token.js

/*
  This file is responsible for:
  - Saving token
  - Getting token
  - Removing token
  All from localStorage
*/


// Save token into browser localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};


// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};


// Remove token (used during logout)
export const removeToken = () => {
  localStorage.removeItem("token");
};