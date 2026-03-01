// helper/token.js

export const getTokenFromLocalStorage = (tokenKey) => {
  if (typeof window === "undefined") {
    // console.log("localStorage not available (server side)");
    return null;
  }
  // console.log("Fetching token from localStorage:", tokenKey);
  const tokenValue = localStorage.getItem(tokenKey);
  // console.log("this is token value", tokenValue);
  return tokenValue;
};

export const getRefreshTokenFromLocalStorage = (tokenKey) => {
  if (typeof window === "undefined") {
    // console.log("localStorage not available (server side)");
    return null;
  }
  // console.log("Fetching refresh token from localStorage:", tokenKey);
  const tokenValue = localStorage.getItem(tokenKey);
  // console.log("this is refresh token value", tokenValue);
  return tokenValue;
};

export const setTokenToLocalStorage = (tokenKey, tokenValue) => {
  if (typeof window === "undefined") {
    // console.log("localStorage not available (server side)");
    return;
  }
  // console.log("Setting token to localStorage:", tokenKey, tokenValue);
  localStorage.setItem(tokenKey, tokenValue);
};

export const removeTokenFromLocalStorage = (tokenKey) => {
  if (typeof window === "undefined") {
    // console.log("localStorage not available (server side)");
    return;
  }
  // console.log("Removing token from localStorage:", tokenKey);
  localStorage.removeItem(tokenKey);
};
