import { createContext, useContext, useEffect, useState } from "react";
import { addCartItem, checkoutCart, getCartItems, removeCartItemById, updateCartItemQty } from "../services/api";
import { useNotifications } from "./NotificationContext";
import { formatCurrency } from "../utils/currency";

const CartContext = createContext();

function updateUsageStatsForActiveUser(order) {
  const storedUser = localStorage.getItem("bites_basic_user");
  if (!storedUser) return;

  try {
    const user = JSON.parse(storedUser);
    const email = user?.email;
    if (!email) return;

    const usageKey = `bites_usage_${email.toLowerCase()}`;
    const existing = localStorage.getItem(usageKey);
    const currentUsage = existing
      ? JSON.parse(existing)
      : {
          orderCount: 0,
          totalSpent: 0,
          favoriteRestaurant: "",
          streakDays: 0,
          lastOrderDate: null,
        };

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let streakDays = currentUsage.streakDays || 0;
    if (currentUsage.lastOrderDate) {
      const last = new Date(currentUsage.lastOrderDate);
      const lastDateOnly = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      const diffDays = Math.floor((todayDateOnly - lastDateOnly) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streakDays += 1;
      } else if (diffDays > 1) {
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    const nextUsage = {
      orderCount: (currentUsage.orderCount || 0) + 1,
      totalSpent: (currentUsage.totalSpent || 0) + (Number(order?.total) || 0),
      favoriteRestaurant: order?.restaurant || currentUsage.favoriteRestaurant || "",
      streakDays,
      lastOrderDate: today.toISOString(),
    };

    localStorage.setItem(usageKey, JSON.stringify(nextUsage));
  } catch {
    // Ignore malformed localStorage data.
  }
}

export function CartProvider({ children }) {
  const { addNotification } = useNotifications();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadCartItems() {
      try {
        setIsLoading(true);
        setError("");
        const items = await getCartItems();

        if (!ignore) {
          setCartItems(items);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load cart items");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCartItems();

    return () => {
      ignore = true;
    };
  }, []);

  const updateQty = async (id, delta) => {
    try {
      setError("");
      const updatedCart = await updateCartItemQty(id, delta);
      setCartItems(updatedCart);
    } catch (err) {
      setError(err.message || "Failed to update item quantity");
    }
  };

  const removeItem = async (id) => {
    try {
      setError("");
      const updatedCart = await removeCartItemById(id);
      setCartItems(updatedCart);
    } catch (err) {
      setError(err.message || "Failed to remove item");
    }
  };

  const addItem = async (item) => {
    try {
      setError("");
      const updatedCart = await addCartItem(item);
      setCartItems(updatedCart);
    } catch (err) {
      setError(err.message || "Failed to add item");
    }
  };

  const placeOrder = async (checkoutOptions = {}) => {
    try {
      setError("");
      setIsPlacingOrder(true);
      const result = await checkoutCart(checkoutOptions);
      setCartItems([]);
      setLastOrder(result.order);
      updateUsageStatsForActiveUser(result.order);
      const orderRestaurant = result.order?.restaurant || "Bites Kitchen";
      addNotification(`Order placed at ${orderRestaurant} for ${formatCurrency(result.order?.total)}`, "✅");
      return result.order;
    } catch (err) {
      setError(err.message || "Failed to place order");
      throw err;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const subtotal = cartItems.reduce((a, c) => a + c.price * c.qty, 0);
  const delivery = 40;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + delivery + taxes;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        updateQty,
        removeItem,
        addItem,
        subtotal,
        delivery,
        taxes,
        total,
        isLoading,
        error,
        isPlacingOrder,
        lastOrder,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
