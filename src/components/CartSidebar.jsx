import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatCurrency } from "../utils/currency";
import styles from "./CartSidebar.module.css";

function buildUpiLabel(name) {
  const normalized = (name || "user").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `${normalized || "user"}@upi`;
}

function buildDefaultPayments(name) {
  return [
    { label: "Cash on Delivery", sub: "Pay when order arrives", icon: "💵" },
    { label: "Visa ending 4242", sub: "Expires 08/26", icon: "💳" },
    { label: buildUpiLabel(name), sub: "UPI ID", icon: "📱" },
  ];
}

const DEFAULT_ADDRESS = {
  label: "Home",
  line: "12B Koramangala, Bengaluru 560034",
};

export default function CartSidebar({ quickAddItems = [] }) {
  const { cartItems, updateQty, removeItem, addItem, subtotal, delivery, taxes, total, isLoading, error, isPlacingOrder, placeOrder } = useCart();
  const navigate = useNavigate();
  const [paymentOptions, setPaymentOptions] = useState(buildDefaultPayments(""));
  const [selectedPayment, setSelectedPayment] = useState(buildDefaultPayments("")[0].label);
  const [addingQuickItemId, setAddingQuickItemId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("bites_basic_user");
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      const defaultPayments = buildDefaultPayments(parsedUser?.name);
      const email = parsedUser?.email?.toLowerCase();
      if (!email) {
        setPaymentOptions(defaultPayments);
        setSelectedPayment(defaultPayments[0].label);
        return;
      }

      const paymentKey = `bites_payments_${email}`;
      const storedPayments = localStorage.getItem(paymentKey);
      if (!storedPayments) {
        setPaymentOptions(defaultPayments);
        setSelectedPayment(defaultPayments[0].label);
        return;
      }

      const parsedPayments = JSON.parse(storedPayments);
      if (Array.isArray(parsedPayments) && parsedPayments.length > 0) {
        const migratedPayments = parsedPayments.map(method => {
          if (method?.sub === "UPI ID" && method?.label === "rahul@upi") {
            return { ...method, label: buildUpiLabel(parsedUser?.name) };
          }
          return method;
        });
        setPaymentOptions(migratedPayments);
        setSelectedPayment(migratedPayments[0].label || defaultPayments[0].label);
        localStorage.setItem(paymentKey, JSON.stringify(migratedPayments));
      }
    } catch {
      // Ignore malformed localStorage and keep defaults.
    }
  }, []);

  const handleCheckout = async () => {
    const savedAddress = localStorage.getItem("bites_delivery_address");
    let address = DEFAULT_ADDRESS;

    if (savedAddress) {
      try {
        const parsedAddress = JSON.parse(savedAddress);
        if (parsedAddress?.label && parsedAddress?.line) {
          address = parsedAddress;
        }
      } catch {
        // Keep default address on parse failure.
      }
    }

    const order = await placeOrder({
      paymentMethod: selectedPayment,
      deliveryAddress: `${address.label}, ${address.line}`,
    });

    if (order) {
      navigate("/orders");
    }
  };

  const handleQuickAdd = async (foodItem) => {
    try {
      setAddingQuickItemId(foodItem.id);
      await addItem({
        name: foodItem.name,
        qty: 1,
        price: Number(foodItem.minOrder) || Number(foodItem.price) || 0,
      });
    } finally {
      setAddingQuickItemId(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>🛒 Cart</div>

      {quickAddItems.length > 0 && (
        <div className={styles.quickAddSection}>
          <div className={styles.quickAddTitle}>Add from menu</div>
          <div className={styles.quickAddList}>
            {quickAddItems.map((foodItem) => (
              <div key={`quick-${foodItem.id}`} className={styles.quickAddItem}>
                <div className={styles.quickAddMeta}>
                  <span className={styles.quickAddEmoji}>{foodItem.img || "🍽️"}</span>
                  <div>
                    <div className={styles.quickAddName}>{foodItem.name}</div>
                    <div className={styles.quickAddPrice}>{formatCurrency(foodItem.minOrder || foodItem.price)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.quickAddBtn}
                  onClick={() => handleQuickAdd(foodItem)}
                  disabled={addingQuickItemId === foodItem.id}
                  aria-label={`Add ${foodItem.name} to cart`}
                >
                  {addingQuickItemId === foodItem.id ? "Adding..." : "+ Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div>Loading cart...</div>
        </div>
      ) : error ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div>{error}</div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div className={styles.emptyIcon}>🛒</div>
          <div>Your cart is empty</div>
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemPrice}>{formatCurrency(item.price)}</div>
                </div>
                <div className={styles.qtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.id, -1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >−</button>
                  <span className={styles.qty}>{item.qty}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.id, 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                  >+</button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery</span><span>{formatCurrency(delivery)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Taxes (5%)</span><span>{formatCurrency(taxes)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Total</span><span className={styles.totalAmt}>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className={styles.paymentSection}>
            <div className={styles.paymentTitle}>Payment Method</div>
            <div className={styles.paymentList}>
              {paymentOptions.map((method, idx) => (
                <button
                  key={`${method.label}-${idx}`}
                  type="button"
                  className={`${styles.paymentOption} ${selectedPayment === method.label ? styles.paymentOptionActive : ""}`}
                  onClick={() => setSelectedPayment(method.label)}
                >
                  <span className={styles.paymentLeft}>
                    <span className={styles.paymentIcon}>{method.icon || "💳"}</span>
                    <span>
                      <span className={styles.paymentLabel}>{method.label}</span>
                      <span className={styles.paymentSub}>{method.sub || ""}</span>
                    </span>
                  </span>
                  <span className={styles.paymentRadio}>{selectedPayment === method.label ? "●" : "○"}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={isPlacingOrder}
            aria-label="Place order"
          >
            {isPlacingOrder ? "Placing..." : "Place Order →"}
          </button>
        </>
      )}
    </div>
  );
}
