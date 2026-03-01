import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`;

const initialState = {
  user: null,
  loading: false,
  error: null,
};

// 🔹 Helper: normalize user data no matter what API returns
const normalizeUser = (payload) => payload?.user || payload?.data || payload || null;

// 🔹 Fetch logged-in user profile
export const fetchAboutUser = createAsyncThunk(
  "auth/fetchAboutUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      if (!token) return rejectWithValue("No token found");

      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch user info");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

// 🔹 Fetch currently authenticated user by ID
export const fetchUserId = createAsyncThunk(
  "auth/fetchUserId",
  async (_, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      if (!token) return rejectWithValue("No token found");

      const res = await fetch(`${BASE_URL}/id`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Not authenticated");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

// 🔹 Login user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Login failed");

      // store tokens in localStorage here
      if (data.token) localStorage.setItem("token", data.token);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

// 🔹 Fetch detailed user info (same as profile, but can be extended)
export const aboutUser = createAsyncThunk(
  "auth/aboutUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      if (!token) return rejectWithValue("No token found");

      const res = await fetch(`${BASE_URL}/profile`, { 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch user details");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

// 🔹 Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAboutUser
      .addCase(fetchAboutUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAboutUser.fulfilled, (state, action) => { state.loading = false; state.user = normalizeUser(action.payload); })
      .addCase(fetchAboutUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Failed to fetch user info"; })

      // fetchUserId
      .addCase(fetchUserId.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserId.fulfilled, (state, action) => { state.loading = false; state.user = normalizeUser(action.payload); })
      .addCase(fetchUserId.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Not authenticated"; })

      // loginUser
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = normalizeUser(action.payload); })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Login failed"; })

      // aboutUser
      .addCase(aboutUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(aboutUser.fulfilled, (state, action) => { state.loading = false; state.user = normalizeUser(action.payload); })
      .addCase(aboutUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Failed to fetch user details"; });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
