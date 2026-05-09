import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { notifications as seedNotifications } from "../data";

const NotificationContext = createContext();

function getNotificationStorageKey(userEmail) {
  return `bites_notifications_${(userEmail || "guest").toLowerCase()}`;
}

export function NotificationProvider({ children, userEmail }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storageKey = getNotificationStorageKey(userEmail);

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          return;
        }
      }
    } catch {
      // Ignore malformed storage values and fallback to defaults.
    }

    const seeded = seedNotifications.map((item) => ({
      ...item,
      id: String(item.id),
    }));
    setNotifications(seeded);
  }, [userEmail]);

  useEffect(() => {
    const storageKey = getNotificationStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, userEmail]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const addNotification = (text, icon = "🔔") => {
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      time: "Just now",
      read: false,
      icon,
    };

    setNotifications((current) => [nextItem, ...current].slice(0, 30));
  };

  const markAsRead = (id) => {
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, read: true } : item
    )));
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
