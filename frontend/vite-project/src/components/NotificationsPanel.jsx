// NOTIFICATION STEP 11: SHOW UNREAD COUNT, HISTORY, AND MARK-ALL-READ UI

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  markAllNotificationsRead,
  selectUnreadNotificationCount
} from "../redux/notificationsSlice";

const getNotificationText = (notification) => {
  const name =
    notification.sender?.name ||
    notification.sender?.username ||
    "Someone";

  if (notification.type === "follow") {
    return `${name} started following you`;
  }

  if (notification.type === "comment") {
    return `${name} commented on your ${notification.reel ? "reel" : "post"}`;
  }

  return `${name} liked your ${notification.reel ? "reel" : "post"}`;
};

function NotificationsPanel() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const loading = useSelector((state) => state.notifications.loading);
  const unreadCount = useSelector(selectUnreadNotificationCount);
  const [open, setOpen] = useState(false);

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50"
      >
        <span className="text-lg">♡</span>
        <span className="flex-1 text-sm font-semibold">Notifications</span>

        {unreadCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-black text-slate-700">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-indigo-600"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <p className="px-3 py-4 text-xs text-slate-400">Loading...</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-400">
                No notifications yet.
              </p>
            )}

            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={
                  notification.isRead
                    ? "border-b border-slate-50 px-3 py-3"
                    : "border-b border-indigo-50 bg-indigo-50/60 px-3 py-3"
                }
              >
                <div className="flex gap-2">
                  <img
                    src={
                      notification.sender?.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        notification.sender?.name || "User"
                      )}&background=6366f1&color=fff`
                    }
                    alt={notification.sender?.name || "User"}
                    className="h-8 w-8 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-5 text-slate-700">
                      {getNotificationText(notification)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPanel;
