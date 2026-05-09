import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFoodItems } from "../services/api";
import { formatCurrency } from "../utils/currency";
import styles from "./Cart.module.css";

const DEFAULT_ADDRESS = {
  label: "Home",
  line: "12B Koramangala, Bengaluru 560034",
};

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

export default function Cart() {
  const { cartItems, updateQty, removeItem, addItem, subtotal, delivery, taxes, total, isLoading, error, isPlacingOrder, placeOrder } = useCart();
  const navigate = useNavigate();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [draftAddress, setDraftAddress] = useState(DEFAULT_ADDRESS);
  const [addressError, setAddressError] = useState("");
  const [paymentOptions, setPaymentOptions] = useState(buildDefaultPayments(""));
  const [selectedPayment, setSelectedPayment] = useState(buildDefaultPayments("")[0].label);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [addingRecommendedId, setAddingRecommendedId] = useState(null);

  useEffect(() => {
    const savedAddress = localStorage.getItem("bites_delivery_address");
    if (savedAddress) {
      try {
        const parsedAddress = JSON.parse(savedAddress);
        if (parsedAddress.label && parsedAddress.line) {
          setAddress(parsedAddress);
          setDraftAddress(parsedAddress);
        }
      } catch {
        // Ignore invalid localStorage and keep defaults.
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRecommendations() {
      try {
        const items = await getFoodItems();
        if (!ignore) {
          setRecommendedItems(items.slice(0, 6));
        }
      } catch {
        if (!ignore) {
          setRecommendedItems([]);
        }
      }
    }

    loadRecommendations();

    return () => {
      ignore = true;
    };
  }, []);

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

  const handlePlaceOrder = async () => {
    const order = await placeOrder({
      paymentMethod: selectedPayment,
      deliveryAddress: `${address.label}, ${address.line}`,
    });
    if (order) {
      navigate("/orders");
    }
  };

  const handleAddressSave = () => {
    const normalizedLabel = draftAddress.label.trim();
    const normalizedLine = draftAddress.line.trim();

    if (!normalizedLabel || !normalizedLine) {
      setAddressError("Please fill both address name and full address");
      return;
    }

    const nextAddress = {
      label: normalizedLabel,
      line: normalizedLine,
    };

    setAddress(nextAddress);
    setDraftAddress(nextAddress);
    setAddressError("");
    setIsEditingAddress(false);
    localStorage.setItem("bites_delivery_address", JSON.stringify(nextAddress));
  };

  const handleAddressCancel = () => {
    setDraftAddress(address);
    setAddressError("");
    setIsEditingAddress(false);
  };

  const handleAddRecommended = async (item) => {
    try {
      setAddingRecommendedId(item.id);
      await addItem({
        name: item.name,
        qty: 1,
        price: Number(item.minOrder) || Number(item.price) || 0,
      });
    } finally {
      setAddingRecommendedId(null);
    }
  };

  return (
    <div className={`page fade-up`}>
      <h2 className={styles.title}>Your Cart</h2>

      {isLoading ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div className={styles.emptyText}>Loading cart...</div>
        </div>
      ) : error ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div className={styles.emptyText}>{error}</div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className={styles.empty} role="status" aria-live="polite">
          <div className={styles.emptyEmoji}>🛒</div>
          <div className={styles.emptyText}>Your cart is empty</div>
          <div className={styles.emptySub}>Add something delicious from the menu</div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.itemsCol}>
            <div className={styles.sectionLabel}>
              {cartItems.reduce((a, c) => a + c.qty, 0)} items
            </div>
            {cartItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemMeta}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemUnit}>{formatCurrency(item.price)} each</div>
                </div>
                <div className={styles.itemActions}>
                  <div className={styles.qtyControl}>
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
                  </div>
                  <div className={styles.lineTotal}>{formatCurrency(item.price * item.qty)}</div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >✕</button>
                </div>
              </div>
            ))}

            {recommendedItems.length > 0 && (
              <div className={styles.addMore}>
                <div className={styles.addMoreTitle}>Recommended For You</div>
                {recommendedItems.map((item) => (
                  <div key={item.id} className={styles.suggestion}>
                    <span>{item.img || "🍽️"} {item.name} {formatCurrency(item.minOrder || item.price)}</span>
                    <button
                      type="button"
                      className={`${styles.addBtn} ${addingRecommendedId === item.id ? styles.addBtnAdding : ""}`}
                      onClick={() => handleAddRecommended(item)}
                      disabled={addingRecommendedId === item.id}
                      aria-label={`Add ${item.name} to cart`}
                    >
                      {addingRecommendedId === item.id ? "Adding..." : "+ Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className={styles.summaryCol}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Order Summary</div>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery fee</span><span>{formatCurrency(delivery)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>GST (5%)</span><span>{formatCurrency(taxes)}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmt}>{formatCurrency(total)}</span>
              </div>

              <div className={styles.addressSection}>
                <div className={styles.couponLabel}>Delivering to</div>
                <div className={styles.address}>
                  <span className={styles.addressIcon}>📍</span>
                  {!isEditingAddress ? (
                    <>
                      <div>
                        <div className={styles.addressName}>{address.label}</div>
                        <div className={styles.addressText}>{address.line}</div>
                      </div>
                      <button type="button" className={styles.changeBtn} onClick={() => setIsEditingAddress(true)} aria-label="Change delivery address">Change</button>
                    </>
                  ) : (
                    <div className={styles.addressEditor}>
                      <input
                        aria-label="Address label"
                        className={styles.addressInput}
                        value={draftAddress.label}
                        onChange={(e) => setDraftAddress(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Address name (Home, Office...)"
                      />
                      <textarea
                        aria-label="Address line"
                        className={styles.addressTextarea}
                        value={draftAddress.line}
                        onChange={(e) => setDraftAddress(prev => ({ ...prev, line: e.target.value }))}
                        placeholder="Flat / House no, street, area, city, pincode"
                        rows={2}
                      />
                      {addressError && <div className={styles.addressError}>{addressError}</div>}
                      <div className={styles.addressActions}>
                        <button type="button" className={styles.addressSaveBtn} onClick={handleAddressSave} aria-label="Save address">Save</button>
                        <button type="button" className={styles.addressCancelBtn} onClick={handleAddressCancel} aria-label="Cancel address edit">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.paymentSection}>
                <div className={styles.couponLabel}>Payment method</div>
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

              <button type="button" className={styles.placeBtn} onClick={handlePlaceOrder} disabled={isPlacingOrder} aria-label="Place order">
                {isPlacingOrder ? "Placing Order..." : `Place Order · ${formatCurrency(total)}`}
              </button>

              <div className={styles.safeNote}>🔒 Secured by 256-bit SSL encryption</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
