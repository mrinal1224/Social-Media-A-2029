// NOTIFICATION STEP 9: ONE REDUX SOURCE OF TRUTH FOR OFFLINE + REALTIME NOTIFICATIONS
// REST fills the initial list; Socket.IO prepends new events into the same state.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/notifications");
      return data.notifications;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to fetch notifications"
      );
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/readAll",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to mark notifications as read"
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: ""
  },
  reducers: {
    // Realtime events enter Redux here. Avoid duplicates in case the same
    // notification was already loaded from the REST endpoint.
    addNotification: (state, action) => {
      const exists = state.items.some(
        (notification) => notification._id === action.payload._id
      );

      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    clearNotifications: (state) => {
      state.items = [];
      state.loading = false;
      state.error = "";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((notification) => {
          notification.isRead = true;
        });
      });
  }
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;

export const selectUnreadNotificationCount = (state) =>
  state.notifications.items.filter((notification) => !notification.isRead).length;

export default notificationsSlice.reducer;
