import { createSlice } from "@reduxjs/toolkit";
import { clearChannelConnections } from "../../utils/channelConnections";

// ─── localStorage helpers ──────────────────────────────────────────────────────

/** Persist the full auth payload returned by the API. */
export function saveAuthToStorage(data) {
  if (!data) return;
  const { token, token_type, user, is_new } = data;
  if (token)      localStorage.setItem("token",      token);
  if (user)       localStorage.setItem("user",       JSON.stringify(user));
  if (is_new !== undefined) localStorage.setItem("is_new", String(is_new));
}

/** Clear only auth-related keys — preserves lang/theme preferences. */
export function clearAuthFromStorage() {
  ["token", "token_type", "user", "is_new"].forEach((key) =>
    localStorage.removeItem(key)
  );
  clearChannelConnections();
}

/** Rehydrate state from localStorage on app boot. */
function loadInitialState() {
  try {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");
    return {
      user,
      token:          token || null,
      tokenType:      localStorage.getItem("token_type") || "Bearer",
      isAuthenticated: Boolean(token),
      isNew:          localStorage.getItem("is_new") === "true",
    };
  } catch {
    return { user: null, token: null, tokenType: "Bearer", isAuthenticated: false, isNew: false };
  }
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    /** Call with the `data` object from the API response. */
    setAuth: (state, action) => {
      const { token, token_type, user, is_new } = action.payload ?? {};
      state.token          = token          ?? state.token;
      state.tokenType      = token_type     ?? state.tokenType;
      state.user           = user           ?? state.user;
      state.isNew          = is_new         ?? false;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user           = null;
      state.token          = null;
      state.tokenType      = "Bearer";
      state.isAuthenticated = false;
      state.isNew          = false;
      clearAuthFromStorage();
    },
  },
});

export const { setAuth, logout } = authSlice.actions;

// keep setUser as an alias so nothing else breaks
export const setUser = setAuth;

export default authSlice.reducer;
