import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


import { getTokenFromLocalStorage,getRefreshTokenFromLocalStorage } from "@/helper/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 🔹 Fetch subcategories
export const fetchSubcategories = createAsyncThunk(
  "subcategories/fetchSubcategories",
  async (id, { rejectWithValue }) => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    try {
      const response = await fetch(`${BASE_URL}/services/fetch-categories/${id}`, {
        headers: {
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch subcategories");
      const data = await response.json();
      return data; // { message, data: [...] }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🔹 Edit subcategory
export const editSubcategory = createAsyncThunk(
  "subcategories/editSubcategory",
  async ({ id, name }, { rejectWithValue }) => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    try {
      const response = await fetch(`${BASE_URL}/services/edit-category/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to edit subcategory");
      const data = await response.json();
      return data.data; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🔹 Delete subcategory
export const deleteSubcategory = createAsyncThunk(
  "subcategories/deleteSubcategory",
  async (id, { rejectWithValue }) => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    try {
      const response = await fetch(`${BASE_URL}/services/delete-category/${id}`, {
        method: "DELETE",
        headers: {
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });
      if (!response.ok) throw new Error("Failed to delete subcategory");
      return id; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const subcategorySlice = createSlice({
  name: "subcategories",
  initialState: {
    data: [], 
    loading: false,
    error: null,
  },
  reducers: {
    clearSubcategories: (state) => {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchSubcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data; 
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // edit
      .addCase(editSubcategory.fulfilled, (state, action) => {
        const index = state.data.findIndex((sc) => sc.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // delete
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.data = state.data.filter((sc) => sc.id !== action.payload);
      });
  },
});

export const { clearSubcategories } = subcategorySlice.actions;

export default subcategorySlice.reducer;
