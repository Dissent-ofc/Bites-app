import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, signUpUser } from "../services/api";
import styles from "./Login.module.css";

export default function Login({ onLogin, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedPhone = phone.trim();

    if (mode === "signup" && !trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email ID";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Password is required";
    }

    if (mode === "signup") {
      const digitsOnlyPhone = trimmedPhone.replace(/\D/g, "");

      if (!digitsOnlyPhone) {
        nextErrors.phone = "Phone number is required";
      } else if (digitsOnlyPhone.length !== 10) {
        nextErrors.phone = "Enter a 10-digit phone number";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setErrors({});
      setIsSubmitting(true);

      const user = mode === "signup"
        ? await signUpUser({ name, email, phone, password })
        : await loginUser({ email, password });

      const normalizedEmail = (user?.email || email).toLowerCase();
      if (normalizedEmail) {
        localStorage.setItem(`bites_user_state_${normalizedEmail}`, mode === "signup" ? "new" : "existing");
      }

      onLogin(user);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err.message || "Authentication failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.themeBtn}
        onClick={onToggleTheme}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>
      <div className={styles.card}>
        <div className={styles.logo}>bites.</div>
        <h1 className={styles.title}>{mode === "login" ? "Login" : "Sign Up"}</h1>
        <p className={styles.sub}>
          {mode === "login" ? "Sign in to continue to your dashboard" : "Create an account to continue"}
        </p>

        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.switchBtn} ${mode === "login" ? styles.switchActive : ""}`}
            onClick={() => {
              setMode("login");
              setErrors({});
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.switchBtn} ${mode === "signup" ? styles.switchActive : ""}`}
            onClick={() => {
              setMode("signup");
              setErrors({});
            }}
          >
            Sign Up
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <>
              <label className={styles.label}>Name</label>
              <input
                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.name;
                      return next;
                    });
                  }
                }}
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.name && <div className={styles.fieldError}>{errors.name}</div>}

              <label className={styles.label}>Phone</label>
              <input
                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                type="text"
                value={phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(digitsOnly);
                  if (errors.phone) {
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.phone;
                      return next;
                    });
                  }
                }}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
              />
              {errors.phone && <div className={styles.fieldError}>{errors.phone}</div>}
            </>
          )}

          <label className={styles.label}>Email</label>
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors((current) => {
                  const next = { ...current };
                  delete next.email;
                  return next;
                });
              }
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <div className={styles.fieldError}>{errors.email}</div>}

          <label className={styles.label}>Password</label>
          <input
            className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((current) => {
                  const next = { ...current };
                  delete next.password;
                  return next;
                });
              }
            }}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {errors.password && <div className={styles.fieldError}>{errors.password}</div>}

          {errors.form && <div className={styles.error}>{errors.form}</div>}

          <button className={styles.loginBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === "login" ? "Logging in..." : "Creating account...")
              : (mode === "login" ? "Login" : "Sign Up")}
          </button>

          {mode === "signup" && (
            <div className={styles.helperText}>If account already exists, use Login tab.</div>
          )}
        </form>
      </div>
    </div>
  );
}
