import { useEffect, useState } from "react";
import { getOrders, cancelOrder, deliverOrder } from "../services/api";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import styles from "./Orders.module.css";

const statusColor = { Delivered: "badge-green", Cancelled: "badge-orange", "On the way": "badge-blue" };

const DELIVERY_TIME_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

function buildOrderIcon(orderCode) {
  const icons = ["🛵", "🚴", "🚚", "📦", "🍕", "🍔", "🌮", "🥗", "🍜", "🍱"];
  const numericSeed = Number(String(orderCode || "").replace(/\D/g, "")) || 0;
  return icons[numericSeed % icons.length];
}

export default function Orders({ user }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [countdowns, setCountdowns] = useState({});
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      setIsNewUser(true);
      return;
    }

    try {
      const normalizedEmail = user.email.toLowerCase();
      const usageKey = `bites_usage_${normalizedEmail}`;
      const storedUsage = localStorage.getItem(usageKey);
      const userState = localStorage.getItem(`bites_user_state_${normalizedEmail}`);

      if (!storedUsage) {
        setIsNewUser(userState === "new");
        return;
      }

      const usage = JSON.parse(storedUsage);
      setIsNewUser((usage?.orderCount || 0) === 0);
    } catch {
      setIsNewUser(true);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      if (isNewUser) {
        setOrderHistory([]);
        setCountdowns({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const orders = await getOrders();

        if (!ignore) {
          setOrderHistory(orders);
          // Initialize countdowns for "On the way" orders
          const newCountdowns = {};
          orders.forEach(order => {
            if (order.status === "On the way" && order.createdAt) {
              newCountdowns[order.id] = calculateRemainingTime(order.createdAt);
            }
          });
          setCountdowns(newCountdowns);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load order history");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [isNewUser]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(orderId => {
          const remaining = updated[orderId];
          if (remaining > 0) {
            updated[orderId] = remaining - 1000;
            hasChanges = true;

            // Order is delivered when countdown reaches 0
            if (updated[orderId] <= 0) {
              updated[orderId] = 0;
              // Call API to update order status
              deliverOrder(orderId)
                .then(updatedOrders => {
                  setOrderHistory(updatedOrders);
                })
                .catch(() => {
                  // Update locally if API fails
                  setOrderHistory(prev =>
                    prev.map(o =>
                      o.id === orderId ? { ...o, status: "Delivered" } : o
                    )
                  );
                });
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateRemainingTime = (createdAt) => {
    const orderTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const elapsed = currentTime - orderTime;
    const remaining = Math.max(0, DELIVERY_TIME_MS - elapsed);
    return remaining;
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingId(orderId);
      setError("");
      const updatedOrders = await cancelOrder(orderId);
      setOrderHistory(updatedOrders);
    } catch (err) {
      setError(err.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (order) => {
    try {
      setReorderingId(order.id);
      setError("");

      // Order history stores combined items text, so reorder as one line item.
      await addItem({
        name: `${order.restaurant} Reorder`,
        qty: 1,
        price: Number(order.total) || 0,
      });

      navigate("/cart");
    } catch (err) {
      setError(err.message || "Failed to reorder");
    } finally {
      setReorderingId(null);
    }
  };

  const handleInvoiceDownload = async (order) => {
    const invoiceNumber = order?.orderCode || `#${order?.id || Date.now()}`;
    const safeInvoiceNumber = String(invoiceNumber).replace(/[^a-zA-Z0-9-_#]/g, "");
    const orderedAt = order?.createdAt
      ? new Date(order.createdAt).toLocaleString("en-IN")
      : order?.time || "N/A";

    const invoiceLines = [
      "Bites - Order Invoice",
      "=====================",
      `Invoice No: ${safeInvoiceNumber}`,
      `Date: ${orderedAt}`,
      "",
      `Customer: ${user?.name || "Guest"}`,
      `Email: ${user?.email || "N/A"}`,
      "",
      `Restaurant: ${order?.restaurant || "Bites Kitchen"}`,
      `Items: ${order?.items || "N/A"}`,
      `Amount: ${formatCurrency(order?.total)}`,
      `Payment Method: ${order?.paymentMethod || "Cash on Delivery"}`,
      `Delivery Address: ${order?.deliveryAddress || "N/A"}`,
      `Status: ${order?.status || "N/A"}`,
      "",
      "Thank you for ordering with Bites.",
    ];

    const invoiceContent = invoiceLines.join("\n");
    const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `invoice-${safeInvoiceNumber || Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`page fade-up`}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Your Orders</h2>
        <span className={styles.sub}>{orderHistory.length} total</span>
      </div>

      {isLoading && <div className={styles.list}>Loading orders...</div>}
      {!isLoading && error && <div className={styles.list}>{error}</div>}

      {!isLoading && !error && <div className={styles.list}>
        {orderHistory.length === 0 && (
          <div className={styles.emptyState}>No orders yet. Place your first order from Home.</div>
        )}

        {orderHistory.map((o, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.emoji}>{o.img || buildOrderIcon(o.orderCode)}</div>
              <div>
                <div className={styles.rowTop}>
                  <span className={styles.orderId}>{o.orderCode}</span>
                  <span className={`badge ${statusColor[o.status] || "badge-muted"}`}>{o.status}</span>
                </div>
                <div className={styles.restaurant}>{o.restaurant}</div>
                <div className={styles.items}>{o.items}</div>
                <div className={styles.time}>{o.time}</div>
                {o.paymentMethod && <div className={styles.metaLine}>Payment: {o.paymentMethod}</div>}
                {o.status === "On the way" && countdowns[o.id] !== undefined && countdowns[o.id] > 0 && (
                  <div className={styles.arrivalCountdown}>
                    <div className={styles.arrivalLabel}>📍 Estimated Arrival</div>
                    <div className={styles.arrivalTimer}>{formatTime(countdowns[o.id])}</div>
                    <div className={styles.arrivalSub}>Your order is on the way</div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.cardRight}>
              <div className={styles.total}>{formatCurrency(o.total)}</div>
              <button
                className={styles.reorderBtn}
                onClick={() => handleReorder(o)}
                disabled={reorderingId === o.id}
              >
                {reorderingId === o.id ? "Reordering..." : "Reorder"}
              </button>
              <button className={styles.invoiceBtn} onClick={() => handleInvoiceDownload(o)}>Invoice ↓</button>
              {o.status !== "Delivered" && o.status !== "Cancelled" && (
                <button
                  className={styles.cancelBtn}
                  onClick={() => handleCancelOrder(o.id)}
                  disabled={cancellingId === o.id}
                >
                  {cancellingId === o.id ? "Cancelling..." : "Cancel"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
