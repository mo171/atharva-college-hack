import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log if there's meaningful error information
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = error.message;
      const status = error.response.status;
      const url = error.config?.url;
      
      // Log meaningful error information
      if (errorData && Object.keys(errorData).length > 0) {
        console.error("API Error:", {
          status,
          url,
          data: errorData,
          message: errorMessage,
        });
      } else if (errorMessage) {
        console.error("API Error:", {
          status,
          url,
          message: errorMessage,
        });
      }
      // If no meaningful data, don't log empty object
    } else if (error.message) {
      // Network error or other non-HTTP error
      console.error("API Error (Network):", error.message);
    }
    return Promise.reject(error);
  },
);
