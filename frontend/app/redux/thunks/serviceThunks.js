import { createAsyncThunk } from "@reduxjs/toolkit";
import { getTokenFromLocalStorage } from "@/helper/token";

// Public APIs → no auth required
const BASE_URL_PUBLIC = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services`;

export const fetchAllServicesName = createAsyncThunk(
  "services/fetchAllServicesName",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL_PUBLIC}/service`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch all services");
      }
      const data = await response.json();
      return data.data.services || [];
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

export const fetchServicesImageTitleRate = createAsyncThunk(
  "services/fetchServicesImageTitleRate",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL_PUBLIC}/service-picture?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch services");
      }
      const data = await response.json();
      const services = data.results.map((service) => ({
        id: service.id,
        name: service.Service?.name,
        rate: service.rate,
        description: service.description,
        images: service.ServiceImages?.map((img) => img.image_path) || [],
        location: service.ServiceLocations?.[0] || null,
        packages: service.Packages || [],
      }));
      return services;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

export const fetchServiceDetailById = createAsyncThunk(
  "services/fetchServiceDetailById",
  async ({ service, lat, lon }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (lat && lon) {
        query.append("lat", lat);
        query.append("lon", lon);
      }
      const response = await fetch(`${BASE_URL_PUBLIC}/service-detail/${service}?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch service details");
      }
      const data = await response.json();
      return data.data.serviceDetail || null;
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

// Auth-required APIs → replace credentials with Authorization header
const BASE_URL_PROVIDER = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/services`;

export const fetchMyServices = createAsyncThunk(
  "services/fetchMyServices",
  async ({ limit = 10, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      if (!token) return rejectWithValue("No token found");

      const response = await fetch(`${BASE_URL_PROVIDER}?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch my services");
      }
      const data = await response.json();
      return data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);

export const fetchMyServicesTitleRate = createAsyncThunk(
  "services/fetchMyServicesTitleRate",
  async ({ limit = 10, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const token = getTokenFromLocalStorage("token");
      if (!token) return rejectWithValue("No token found");

      const response = await fetch(`${BASE_URL_PROVIDER}/summary?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch my services");
      }
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Something went wrong");
    }
  }
);
