import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

// Async thunk to fetch rooms by type
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const fetchMyRooms = createAsyncThunk(
  "gharbeti/fetchMyRooms",
  async (params = {}, { rejectWithValue }) => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    try {
      const {
        type = "listed",
        search = "",
        limit = 10,
        offset = 0,
        ordering = "",
        availability_status = "",
      } = params;


      const query = new URLSearchParams({ limit, offset, type });

      if (search) query.set("search", search);
      if (ordering) query.set("ordering", ordering);
      if (availability_status && availability_status !== "all")
        query.set("availability_status", availability_status);

  const url = `${BASE_URL}/api/rooms/my-rooms?${query.toString()}`;

  // console.log("Fetching rooms from:", url);

      const response = await fetch(url, {
        headers: {
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return rejectWithValue(data || { message: "Failed to fetch rooms" });
      }

      // ✅ Map backend fields to consistent Redux state
      return {
        rooms: data.results || [],
        count: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || offset,
        next: data.next || null,
        previous: data.previous || null,
        type,
      };
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return rejectWithValue({ message: error.message || "Network error" });
    }
  }
);


// Slice for rooms
const roomsSlice = createSlice({
  name: "rooms",
  initialState: {
    rooms: [],
    count: 0,
    loading: false,
    error: null,
    type: "listed", 
  },
  reducers: {
    clearRooms: (state) => {
      state.rooms = [];
      state.count = 0;
      state.loading = false;
      state.error = null;
      state.type = "listed";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload.rooms || [];
        state.count = action.payload.count || 0;
        state.type = action.payload.type || "listed";
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch rooms";
      });
  },
});

// Alias for fetchMyRooms to match the import
export const fetchMyListedRooms = fetchMyRooms;

export const { clearRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
