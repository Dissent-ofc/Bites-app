import { useEffect, useState } from "react";
import { getOrders } from "../services/api";
import styles from "./Profile.module.css";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
};

const DEFAULT_ADDRESSES = [
  { label: "Home", address: "12B Koramangala, Bengaluru 560034", icon: "🏠" },
  { label: "Office", address: "4th Floor, Tower B, MG Road, Bengaluru 560001", icon: "🏢" },
];

function buildUpiLabel(name) {
  const normalized = (name || "user").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `${normalized || "user"}@upi`;
}

function buildDefaultPayments(name) {
  return [
    { label: "Visa ending 4242", sub: "Expires 08/26", icon: "💳" },
    { label: buildUpiLabel(name), sub: "UPI ID", icon: "📱" },
    { label: "Cash on Delivery", sub: "Available", icon: "💵" },
  ];
}

const preferences = ["No onions", "Extra spicy", "Vegan options"];

const EMPTY_USAGE = {
  orderCount: 0,
  totalSpent: 0,
  favoriteRestaurant: "",
  streakDays: 0,
};

export default function Profile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draftProfile, setDraftProfile] = useState(EMPTY_PROFILE);
  const [savedAddresses, setSavedAddresses] = useState(DEFAULT_ADDRESSES);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressDraft, setAddressDraft] = useState({ label: "", address: "", icon: "📍" });
  const [addressError, setAddressError] = useState("");
  const [savedPayments, setSavedPayments] = useState(buildDefaultPayments(""));
  const [editingPaymentIndex, setEditingPaymentIndex] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState({ label: "", sub: "", icon: "💳" });
  const [paymentError, setPaymentError] = useState("");
  const [usage, setUsage] = useState(EMPTY_USAGE);
  const [orderStats, setOrderStats] = useState({ orderCount: 0, totalSpent: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fromUser = {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    };

    setProfile(fromUser);
    setDraftProfile(fromUser);
    setEditingAddressIndex(null);
    setAddressError("");
    setEditingPaymentIndex(null);
    setPaymentError("");

    if (fromUser.email) {
      const normalizedEmail = fromUser.email.toLowerCase();
      const defaultPayments = buildDefaultPayments(fromUser.name);
      const addressKey = `bites_addresses_${normalizedEmail}`;
      const storedAddresses = localStorage.getItem(addressKey);
      const paymentKey = `bites_payments_${normalizedEmail}`;
      const storedPayments = localStorage.getItem(paymentKey);

      if (storedAddresses) {
        try {
          const parsedAddresses = JSON.parse(storedAddresses);
          if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
            setSavedAddresses(parsedAddresses);
          } else {
            setSavedAddresses(DEFAULT_ADDRESSES);
          }
        } catch {
          setSavedAddresses(DEFAULT_ADDRESSES);
        }
      } else {
        setSavedAddresses(DEFAULT_ADDRESSES);
      }

      if (storedPayments) {
        try {
          const parsedPayments = JSON.parse(storedPayments);
          if (Array.isArray(parsedPayments) && parsedPayments.length > 0) {
            const migratedPayments = parsedPayments.map(method => {
              if (method?.sub === "UPI ID" && method?.label === "rahul@upi") {
                return { ...method, label: buildUpiLabel(fromUser.name) };
              }
              return method;
            });
            setSavedPayments(migratedPayments);
            localStorage.setItem(paymentKey, JSON.stringify(migratedPayments));
          } else {
            setSavedPayments(defaultPayments);
          }
        } catch {
          setSavedPayments(defaultPayments);
        }
      } else {
        setSavedPayments(defaultPayments);
      }
    } else {
      setSavedAddresses(DEFAULT_ADDRESSES);
      setSavedPayments(buildDefaultPayments(""));
    }

    if (fromUser.email) {
      const normalizedEmail = fromUser.email.toLowerCase();
      const usageKey = `bites_usage_${normalizedEmail}`;
      const storedUsage = localStorage.getItem(usageKey);

      if (storedUsage) {
        try {
          const parsedUsage = JSON.parse(storedUsage);
          setUsage({
            orderCount: parsedUsage.orderCount || 0,
            totalSpent: parsedUsage.totalSpent || 0,
            favoriteRestaurant: parsedUsage.favoriteRestaurant || "",
            streakDays: parsedUsage.streakDays || 0,
          });
        } catch {
          setUsage(EMPTY_USAGE);
        }
      } else {
        const userState = localStorage.getItem(`bites_user_state_${normalizedEmail}`);

        if (userState === "new") {
          setUsage(EMPTY_USAGE);
        } else {
          const fallbackUsage = {
            orderCount: 6,
            totalSpent: 2890,
            favoriteRestaurant: "Pizza Palace",
            streakDays: 2,
          };
          localStorage.setItem(usageKey, JSON.stringify(fallbackUsage));
          setUsage(fallbackUsage);
        }
      }
    } else {
      setUsage(EMPTY_USAGE);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) {
      setOrderStats({ orderCount: 0, totalSpent: 0 });
      return;
    }

    let ignore = false;

    async function loadOrderStats() {
      try {
        const normalizedEmail = user.email.toLowerCase();
        const usageKey = `bites_usage_${normalizedEmail}`;
        const storedUsage = localStorage.getItem(usageKey);
        const userState = localStorage.getItem(`bites_user_state_${normalizedEmail}`);

        // Keep Profile stats consistent with Orders page new-user behavior.
        if (!storedUsage) {
          const isNewUser = userState === "new";
          if (!ignore && isNewUser) {
            setOrderStats({ orderCount: 0, totalSpent: 0 });
            return;
          }
        } else {
          const parsedUsage = JSON.parse(storedUsage);
          const isNewUser = (parsedUsage?.orderCount || 0) === 0;
          if (!ignore && isNewUser) {
            setOrderStats({ orderCount: 0, totalSpent: 0 });
            return;
          }
        }

        const orders = await getOrders();
        if (ignore) return;

        const totalSpent = orders.reduce((sum, order) => {
          const isCancelled = String(order?.status || "").toLowerCase() === "cancelled";
          return isCancelled ? sum : sum + (Number(order.total) || 0);
        }, 0);
        setOrderStats({ orderCount: orders.length, totalSpent });
      } catch {
        if (!ignore) {
          setOrderStats({ orderCount: 0, totalSpent: 0 });
        }
      }
    }

    loadOrderStats();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleSave = () => {
    const nextProfile = {
      name: draftProfile.name.trim(),
      email: draftProfile.email.trim(),
      phone: draftProfile.phone.trim(),
    };

    if (!nextProfile.name || !nextProfile.email) {
      setError("Please fill name and email");
      return;
    }

    const updatedUser = { ...user, ...nextProfile };

    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    setError("");
    setIsEditing(false);
    onUserUpdate(updatedUser);
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setError("");
    setIsEditing(false);
  };

  const persistAddresses = (nextAddresses) => {
    if (!profile.email) return;
    const addressKey = `bites_addresses_${profile.email.toLowerCase()}`;
    localStorage.setItem(addressKey, JSON.stringify(nextAddresses));
  };

  const persistPayments = (nextPayments) => {
    if (!profile.email) return;
    const paymentKey = `bites_payments_${profile.email.toLowerCase()}`;
    localStorage.setItem(paymentKey, JSON.stringify(nextPayments));
  };

  const handleStartEditAddress = (index) => {
    const target = savedAddresses[index];
    if (!target) return;

    setEditingAddressIndex(index);
    setAddressDraft({
      label: target.label || "",
      address: target.address || "",
      icon: target.icon || "📍",
    });
    setAddressError("");
  };

  const handleSaveAddress = () => {
    const nextLabel = addressDraft.label.trim();
    const nextAddress = addressDraft.address.trim();

    if (!nextLabel || !nextAddress) {
      setAddressError("Please fill both label and address");
      return;
    }

    const nextAddresses = [...savedAddresses];
    nextAddresses[editingAddressIndex] = {
      ...nextAddresses[editingAddressIndex],
      label: nextLabel,
      address: nextAddress,
    };

    setSavedAddresses(nextAddresses);
    persistAddresses(nextAddresses);
    setEditingAddressIndex(null);
    setAddressError("");
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressIndex(null);
    setAddressError("");
  };

  const handleAddAddress = () => {
    const nextAddresses = [
      ...savedAddresses,
      { label: "New", address: "", icon: "📍" },
    ];
    const nextIndex = nextAddresses.length - 1;

    setSavedAddresses(nextAddresses);
    persistAddresses(nextAddresses);
    setEditingAddressIndex(nextIndex);
    setAddressDraft({ label: "New", address: "", icon: "📍" });
    setAddressError("");
  };

  const handleStartEditPayment = (index) => {
    const target = savedPayments[index];
    if (!target) return;

    setEditingPaymentIndex(index);
    setPaymentDraft({
      label: target.label || "",
      sub: target.sub || "",
      icon: target.icon || "💳",
    });
    setPaymentError("");
  };

  const handleSavePayment = () => {
    const nextLabel = paymentDraft.label.trim();
    const nextSub = paymentDraft.sub.trim();

    if (!nextLabel || !nextSub) {
      setPaymentError("Please fill both payment name and details");
      return;
    }

    const nextPayments = [...savedPayments];
    nextPayments[editingPaymentIndex] = {
      ...nextPayments[editingPaymentIndex],
      label: nextLabel,
      sub: nextSub,
    };

    setSavedPayments(nextPayments);
    persistPayments(nextPayments);
    setEditingPaymentIndex(null);
    setPaymentError("");
  };

  const handleCancelPaymentEdit = () => {
    setEditingPaymentIndex(null);
    setPaymentError("");
  };

  const handleAddPayment = () => {
    const nextPayments = [
      ...savedPayments,
      { label: "New payment", sub: "Add details", icon: "💳" },
    ];
    const nextIndex = nextPayments.length - 1;

    setSavedPayments(nextPayments);
    persistPayments(nextPayments);
    setEditingPaymentIndex(nextIndex);
    setPaymentDraft({ label: "New payment", sub: "", icon: "💳" });
    setPaymentError("");
  };

  return (
    <div className={`page fade-up`}>
      <h2 className={styles.title}>Profile</h2>

      <div className={styles.grid}>
        {/* Avatar Card */}
        <div className={`${styles.card} ${styles.avatarCard}`}>
          <div className={styles.avatar}>{profile.name.charAt(0).toUpperCase()}</div>
          <div>
            {!isEditing ? (
              <>
                <div className={styles.name}>{profile.name}</div>
                <div className={styles.email}>{profile.email}</div>
                <div className={styles.phone}>{profile.phone}</div>
              </>
            ) : (
              <div className={styles.editorWrap}>
                <input
                  className={styles.editorInput}
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
                <input
                  className={styles.editorInput}
                  value={draftProfile.email}
                  onChange={(e) => setDraftProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                />
                <input
                  className={styles.editorInput}
                  value={draftProfile.phone}
                  onChange={(e) => setDraftProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                />
                {error && <div className={styles.errorText}>{error}</div>}
              </div>
            )}
            <div className={styles.badges}>
              <span className="badge badge-orange">{orderStats.orderCount} orders</span>
              <span className="badge badge-purple">{orderStats.orderCount > 0 ? "Active member" : "New user"}</span>
              <span className="badge badge-green">{usage.streakDays > 0 ? `${usage.streakDays} day streak` : "No streak yet"}</span>
            </div>
          </div>
          {!isEditing ? (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>Edit Profile</button>
          ) : (
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSave}>Save</button>
              <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>

        {/* Saved Addresses */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📍 Saved Addresses</div>
          {savedAddresses.map((a, i) => (
            <div key={i} className={styles.listItem}>
              <span className={styles.listIcon}>{a.icon}</span>
              {editingAddressIndex === i ? (
                <div className={styles.addressEditor}>
                  <input
                    className={styles.editorInput}
                    value={addressDraft.label}
                    onChange={(e) => setAddressDraft(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Label (Home, Office...)"
                  />
                  <input
                    className={styles.editorInput}
                    value={addressDraft.address}
                    onChange={(e) => setAddressDraft(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full address"
                  />
                  {addressError && <div className={styles.errorText}>{addressError}</div>}
                  <div className={styles.addressActions}>
                    <button className={styles.saveBtn} onClick={handleSaveAddress}>Save</button>
                    <button className={styles.cancelBtn} onClick={handleCancelAddressEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className={styles.listLabel}>{a.label}</div>
                    <div className={styles.listSub}>{a.address}</div>
                  </div>
                  <button className={styles.ghostBtn} onClick={() => handleStartEditAddress(i)}>Edit</button>
                </>
              )}
            </div>
          ))}
          <button className={styles.addNewBtn} onClick={handleAddAddress}>+ Add new address</button>
        </div>

        {/* Payment Methods */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>💳 Payment Methods</div>
          {savedPayments.map((p, i) => (
            <div key={i} className={styles.listItem}>
              <span className={styles.listIcon}>{p.icon}</span>
              {editingPaymentIndex === i ? (
                <div className={styles.addressEditor}>
                  <input
                    className={styles.editorInput}
                    value={paymentDraft.label}
                    onChange={(e) => setPaymentDraft(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Payment name"
                  />
                  <input
                    className={styles.editorInput}
                    value={paymentDraft.sub}
                    onChange={(e) => setPaymentDraft(prev => ({ ...prev, sub: e.target.value }))}
                    placeholder="Details (expiry, UPI ID, etc.)"
                  />
                  {paymentError && <div className={styles.errorText}>{paymentError}</div>}
                  <div className={styles.addressActions}>
                    <button className={styles.saveBtn} onClick={handleSavePayment}>Save</button>
                    <button className={styles.cancelBtn} onClick={handleCancelPaymentEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className={styles.listLabel}>{p.label}</div>
                    <div className={styles.listSub}>{p.sub}</div>
                  </div>
                  <button className={styles.ghostBtn} onClick={() => handleStartEditPayment(i)}>Edit</button>
                </>
              )}
            </div>
          ))}
          <button className={styles.addNewBtn} onClick={handleAddPayment}>+ Add payment method</button>
        </div>

        {/* Diet Preferences */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🥗 Diet Preferences</div>
          <div className={styles.prefTags}>
            {preferences.map((p, i) => (
              <span key={i} className={`badge badge-blue`} style={{ padding: "6px 14px", fontSize: 12 }}>{p}</span>
            ))}
          </div>
          <button className={styles.addNewBtn}>+ Add preference</button>
        </div>

        {/* Stats Summary */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📊 Your Stats</div>
          <div className={styles.statGrid}>
            {[
              { label: "Orders", value: String(orderStats.orderCount) },
              { label: "Spent", value: `₹${orderStats.totalSpent.toLocaleString("en-IN")}` },
              { label: "Favourite", value: usage.favoriteRestaurant || "No orders yet" },
              { label: "Streak", value: usage.streakDays > 0 ? `${usage.streakDays} days 🔥` : "No streak yet" },
            ].map((s, i) => (
              <div key={i} className={styles.statItem}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🛟 Help & Support</div>
          {["Chat with us", "FAQs", "Report an issue", "Refund requests"].map((item, i) => (
            <button key={i} className={styles.supportRow}>
              <span>{item}</span>
              <span style={{ color: "var(--muted)" }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
