import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "@/helper/token";

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/kyc/document-type`;



// Async thunk to fetch document types
export const fetchDocumentType = createAsyncThunk(
  "document/fetchDocumentType",
  async (_, { rejectWithValue }) => {
    const token = getTokenFromLocalStorage("token");
    const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
    try {
      const response = await fetch(`${API_BASE}/`, {
        headers: {
          'authorization': `Bearer ${token}`,
          'x-refresh-token': refreshToken,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch document types");
      }

  const data = await response.json();
  // console.log("Fetched document types:", data.data.type);
  return data.data.type;
    } catch (err) {
      console.error("Something went wrong:", err);
      return rejectWithValue(err.message);
    }
  }
);

const documentTypeSlice = createSlice({
  name: "document",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentType.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchDocumentType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default documentTypeSlice.reducer;
