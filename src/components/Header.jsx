import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import styles from "./Header.module.css";

const tabs = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/orders", label: "Orders", icon: "📦" },
  { path: "/cart", label: "Cart", icon: "🛒" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export default function Header({ search, onSearch, user, onLogout, theme, onToggleTheme }) {
  const location = useLocation();
  const { cartItems } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notifOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>🔥</div>
          <span>bites<span className={styles.dot}>.</span></span>
        </Link>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search restaurants or dishes..."
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => onSearch("")}>✕</button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <div className={styles.notifWrap} ref={notifWrapRef}>
            <button className={styles.iconBtn} onClick={() => setNotifOpen(v => !v)}>
              🔔
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeaderRow}>
                  <div className={styles.notifHeader}>Notifications</div>
                  {unreadCount > 0 && (
                    <button type="button" className={styles.markAllBtn} onClick={markAllAsRead}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 && (
                  <div className={styles.notifEmpty}>No notifications yet</div>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    className={`${styles.notifItem} ${!n.read ? styles.unread : ""}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <span className={styles.notifIcon}>{n.icon}</span>
                    <div>
                      <div className={styles.notifText}>{n.text}</div>
                      <div className={styles.notifTime}>{n.time}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>

          <Link to="/cart" className={styles.cartBtn}>
            🛒
            {cartItems.length > 0 && (
              <span className={styles.cartCount}>{cartItems.reduce((a,c) => a+c.qty, 0)}</span>
            )}
          </Link>

          <Link to="/profile" className={styles.avatar}>
            {(user?.name?.charAt(0) || "U").toUpperCase()}
          </Link>
        </div>
      </div>

      <nav className={styles.tabs}>
        {tabs.map(t => (
          <Link
            key={t.path}
            to={t.path}
            className={`${styles.tab} ${location.pathname === t.path ? styles.active : ""}`}
          >
            <span>{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
