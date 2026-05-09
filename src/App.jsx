import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import "./index.css";

function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function ProtectedLayout({ search, onSearch, user, onLogout, theme, onToggleTheme }) {
  return (
    <>
      <Header
        search={search}
        onSearch={onSearch}
        user={user}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <Outlet />
    </>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const storedTheme = localStorage.getItem("bites_theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bites_theme", theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem("bites_basic_user");
    if (!stored) return;

    try {
      const parsedUser = JSON.parse(stored);

      // Force re-login for legacy user records created before JWT support.
      if (!parsedUser?.token) {
        localStorage.removeItem("bites_basic_user");
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("bites_basic_user");
    }
  }, []);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("bites_basic_user", JSON.stringify(nextUser));
  };

  const handleUserUpdate = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("bites_basic_user", JSON.stringify(nextUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("bites_basic_user");
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <NotificationProvider userEmail={user?.email}>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                user
                  ? <Navigate to="/" replace />
                  : <Login onLogin={handleLogin} theme={theme} onToggleTheme={handleToggleTheme} />
              }
            />

            <Route
              element={
                <ProtectedRoute isAuthenticated={Boolean(user)}>
                  <ProtectedLayout
                    search={search}
                    onSearch={setSearch}
                    user={user}
                    onLogout={handleLogout}
                    theme={theme}
                    onToggleTheme={handleToggleTheme}
                  />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home search={search} user={user} />} />
              <Route path="/orders" element={<Orders user={user} />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />
            </Route>

            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </NotificationProvider>
  );
}
