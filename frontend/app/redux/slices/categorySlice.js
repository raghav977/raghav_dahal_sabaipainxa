import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";



const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/service`;

// -------------------- THUNKS -------------------- //

// Fetch all services (paginated or all)
export const fetchServices = createAsyncThunk(
  "service/fetchServices",
  async ({ page = 1, limit = 10, search = "" } = {}, { rejectWithValue }) => {
    try {
      const tokeen = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      // backend expects offset (number of items to skip) not page number
      const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
      const res = await fetch(`${API_BASE}?offset=${offset}&limit=${limit}&search=${encodeURIComponent(search)}`, {
        headers:{
          'authorization': `Bearer ${tokeen}`,
          'x-refresh-token': refreshToken,
        }
      });
  const data = await res.json();
  // console.log("THis is data",data);
      if (!res.ok) throw new Error(data.message || "Failed to fetch services");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Add a new service
export const addService = createAsyncThunk(
  "service/addService",
  async (serviceData, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'authorization': `Bearer ${token}`, 'x-refresh-token': refreshToken },
        body: JSON.stringify(serviceData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add service");
      return data.newService;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Update service
export const updateService = createAsyncThunk(
  "service/updateService",
  async ({ id, name, package_enabled }, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${API_BASE}/edit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", 'authorization': `Bearer ${token}`, 'x-refresh-token': refreshToken },
        body: JSON.stringify({ name, package_enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update service");
      return data.updatedService;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Delete service
export const deleteService = createAsyncThunk(
  "service/deleteService",
  async (id, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${API_BASE}/delete/${id}`, {
        method: "DELETE",
        headers: {
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      if (!res.ok) throw new Error("Failed to delete service");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Category-related functions (aliases for service functions)
export const fetchCategories = fetchServices;
export const addCategory = addService;
export const updateCategory = updateService;
export const deleteCategory = deleteService;

// -------------------- SLICE -------------------- //

const serviceSlice = createSlice({
  name: "service",
  initialState: {
    list: [],
    total: 0,
    limit: 10,
    offset: 0,
    next: null,
    previous: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchServices
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
  // console.log("This is payload", action.payload);
        const { results, total, limit, offset, next, previous } = action.payload;

        state.list = results;
        state.total = total;
        state.limit = limit;
        state.offset = offset;
        state.next = next;
        state.previous = previous;
        state.loading = false;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addService
      .addCase(addService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addService.fulfilled, (state, action) => {
        // Normalize different backend response shapes.
        // Some endpoints return { newService }, others return { data: { ... } },
        // and some may return the item directly.
        const payload = action.payload || {};
        const newItem = payload.newService || payload.data || payload;
        if (newItem) {
          state.list.unshift(newItem);
        } else {
          // If we got nothing useful, don't insert undefined — keep list intact.
          console.warn("addService fulfilled with unexpected payload:", action.payload);
        }
        state.loading = false;
      })
      .addCase(addService.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // updateService
      .addCase(updateService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateService.fulfilled, (state, action) => {
        // Normalize response shapes for updated item
        const payload = action.payload || {};
        const updated = payload.updatedService || payload.data || payload;
        if (updated && updated.id) {
          const index = state.list.findIndex((s) => s.id === updated.id);
          if (index !== -1) state.list[index] = updated;
        } else {
          console.warn("updateService fulfilled with unexpected payload:", action.payload);
        }
        state.loading = false;
      })
      .addCase(updateService.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // deleteService
      .addCase(deleteService.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteService.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default serviceSlice.reducer;
