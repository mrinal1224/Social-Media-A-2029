// NOTIFICATION STEP 10: BIND SOCKET CONNECTION TO AUTHENTICATION LIFECYCLE
// Login -> fetch saved notifications + connect. Logout -> disconnect + clear notification state.

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";
import {
  addNotification,
  clearNotifications,
  fetchNotifications
} from "../redux/notificationsSlice";

// Socket lifecycle belongs to authentication lifecycle:
// logged in -> connect
// logged out -> disconnect
function SocketManager() {
  const { user, loading } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      socket.disconnect();
      dispatch(clearNotifications());
      return;
    }

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    const handleConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
    };

    const handleNewNotification = (notification) => {
      dispatch(addNotification(notification));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("notification:new", handleNewNotification);

    // REST gives us everything that happened while this user was offline.
    dispatch(fetchNotifications());

    // Socket gives us everything that happens from this moment onward.
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("notification:new", handleNewNotification);
      socket.disconnect();
    };
  }, [user?._id, loading, dispatch]);

  return null;
}

export default SocketManager;
