import { useEffect, useState } from "react";
import { getOrders, deliverOrder } from "../services/api";
import { formatCurrency } from "../utils/currency";
import styles from "./LiveTracker.module.css";

const DELIVERY_TIME_MS = 30 * 60 * 1000; // 30 minutes

function buildOrderIcon(orderCode) {
  const icons = ["🛵", "🚴", "🚚", "📦", "🍕", "🍔", "🌮", "🥗", "🍜", "🍱"];
  const numericSeed = Number(String(orderCode || "").replace(/\D/g, "")) || 0;
  return icons[numericSeed % icons.length];
}

export default function LiveTracker() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadActiveOrder() {
      try {
        setIsLoading(true);
        const orders = await getOrders();
        const onTheWay = orders.find(o => o.status === "On the way");
        
        if (!ignore) {
          setActiveOrder(onTheWay || null);
          if (onTheWay && onTheWay.createdAt) {
            const remaining = calculateRemainingTime(onTheWay.createdAt);
            setCountdown(remaining);
          }
        }
      } catch (err) {
        if (!ignore) {
          setActiveOrder(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadActiveOrder();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeOrder) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCountdown = prev - 1000;
        
        // If countdown reaches 0, auto-deliver
        if (newCountdown <= 0) {
          deliverOrder(activeOrder.id)
            .then(updatedOrders => {
              // Find new active order (if any)
              const onTheWay = updatedOrders.find(o => o.status === "On the way");
              setActiveOrder(onTheWay || null);
            })
            .catch(() => {
              // Fallback: just update status locally
              setActiveOrder(prev => prev ? { ...prev, status: "Delivered" } : null);
            });
          return 0;
        }
        
        return newCountdown;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOrder]);

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

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>Live Order</div>
        </div>
        <div className={styles.orderInfo}>
          <div className={styles.noOrder}>Loading orders...</div>
        </div>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>Live Order</div>
        </div>
        <div className={styles.orderInfo}>
          <div className={styles.noOrder}>No active orders</div>
          <div className={styles.noOrderSub}>Your food orders will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Live Order</div>
        <span className={`badge badge-blue pulse`}>● ON THE WAY</span>
      </div>

      <div className={styles.orderInfo}>
        <div className={styles.orderIcon}>{activeOrder.img || buildOrderIcon(activeOrder.orderCode)}</div>
        <div className={styles.orderId}>{activeOrder.orderCode}</div>
        <div className={styles.restaurant}>{activeOrder.restaurant}</div>
        <div className={styles.items}>{activeOrder.items}</div>
        
        {countdown > 0 && (
          <div className={styles.arrivalSection}>
            <div className={styles.arrivalLabel}>📍 Estimated Arrival</div>
            <div className={styles.arrivalTime}>{formatTime(countdown)}</div>
            <div className={styles.arrivalStatus}>🛵 On the way to you</div>
          </div>
        )}

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Order Total</span>
          <span className={styles.totalAmount}>{formatCurrency(activeOrder.total)}</span>
        </div>
        {activeOrder.paymentMethod && (
          <div className={styles.paymentLine}>Payment: {activeOrder.paymentMethod}</div>
        )}
      </div>

      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={`${styles.circle} ${styles.done}`}>✓</div>
          <div className={`${styles.stepLabel} ${styles.stepDone}`}>Order Confirmed</div>
        </div>
        <div className={styles.step}>
          <div className={`${styles.circle} ${styles.active}`}></div>
          <div className={`${styles.stepLabel} ${styles.stepActive}`}>On the Way</div>
        </div>
        <div className={styles.step}>
          <div className={styles.circle}></div>
          <div className={styles.stepLabel}>Delivered</div>
        </div>
      </div>
    </div>
  );
}
