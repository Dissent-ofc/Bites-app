import { useEffect, useState } from "react";
import RestaurantCard from "../components/RestaurantCard";
import LiveTracker from "../components/LiveTracker";
import CartSidebar from "../components/CartSidebar";
import StatCard from "../components/StatCard";
import { categories } from "../data";
import { useCart } from "../context/CartContext";
import { getFoodItems, getOrders } from "../services/api";
import styles from "./Home.module.css";

function getFoodStory(restaurant) {
  const cuisine = (restaurant?.cuisine || "food").toLowerCase();

  if (cuisine.includes("indian") || cuisine.includes("curry")) {
    return {
      ingredients: ["single-origin hand-ground spices", "slow-simmered onion-tomato reduction", "farm-fresh coriander", "golden ghee finish"],
      process: ["patiently marinated in layered masala", "slow-cooked over a gentle flame", "tempered at the finish for aromatic lift"],
      heritage: "Rooted in timeless regional kitchens, this profile celebrates depth, warmth, and soulful complexity.",
      note: "Aromatic, commanding, and profoundly comforting with every spoonful.",
    };
  }

  if (cuisine.includes("japanese") || cuisine.includes("sushi") || cuisine.includes("ramen")) {
    return {
      ingredients: ["umami-forward broth base", "precision-seasoned rice or noodles", "toasted sesame", "micro-fresh herbs"],
      process: ["crafted for clean flavor architecture", "assembled with disciplined precision", "finished moments before service"],
      heritage: "Inspired by minimalist culinary traditions where balance, restraint, and clarity define excellence.",
      note: "Elegant, nuanced, and beautifully composed around refined umami.",
    };
  }

  if (cuisine.includes("italian") || cuisine.includes("pizza") || cuisine.includes("pasta")) {
    return {
      ingredients: ["cold-pressed olive oil", "sun-ripened tomatoes", "fragrant basil", "aged artisanal cheese"],
      process: ["sauce reduced until naturally sweet", "seasoned with thoughtful restraint", "finished for a polished table presentation"],
      heritage: "Echoing old-world trattoria craft, each element is guided by simplicity and ingredient integrity.",
      note: "Velvety, rounded, and deeply satisfying with rustic sophistication.",
    };
  }

  if (cuisine.includes("american") || cuisine.includes("burger")) {
    return {
      ingredients: ["freshly baked buns", "signature house seasoning", "crisp seasonal produce", "slow-crafted savory sauces"],
      process: ["assembled to order", "cooked to a succulent finish", "served immediately for ideal texture contrast"],
      heritage: "A modern comfort classic, elevated through careful layering and balanced richness.",
      note: "Hearty, indulgent, and confidently bold in character.",
    };
  }

  if (cuisine.includes("vegan") || cuisine.includes("salad") || cuisine.includes("bowl")) {
    return {
      ingredients: ["seasonal garden greens", "cold-whisked light dressings", "roasted plant proteins", "fresh textural crunch"],
      process: ["layered for nutritional and flavor balance", "kept vibrant and crisp", "finished with a bright final drizzle"],
      heritage: "Built on contemporary wellness cuisine, where freshness and finesse move in harmony.",
      note: "Bright, graceful, and clean with naturally expressive flavor.",
    };
  }

  return {
    ingredients: ["fresh market produce", "signature in-house seasoning", "hand-prepared base components", "chef-curated garnish"],
    process: ["prepared in small attentive batches", "balanced for flavor depth and texture", "finished with refined plating"],
    heritage: "A contemporary kitchen expression shaped by craftsmanship, freshness, and culinary discipline.",
    note: "Thoughtfully composed with precision, elegance, and character.",
  };
}

export default function Home({ search, user }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStats, setOrderStats] = useState({ orderCount: 0, totalSpent: 0 });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isAddingFromModal, setIsAddingFromModal] = useState(false);
  const { addItem } = useCart();

  const selectedCategory = categories[activeCategory]?.label || "All";

  useEffect(() => {
    let ignore = false;

    async function loadFoodItems() {
      try {
        setIsLoading(true);
        setError("");
        const items = await getFoodItems();

        if (!ignore) {
          setRestaurants(items);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load food items");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadFoodItems();

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = restaurants.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

        // Keep Home stats consistent with Orders page new-user behavior.
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

  const getRestaurantSummary = (restaurant) => {
    const baseSummary = `A great pick for ${restaurant.cuisine.toLowerCase()} cravings.`;

    if (restaurant.tag) {
      return `${baseSummary} ${restaurant.tag} favorite with quick delivery.`;
    }

    return `${baseSummary} Fresh, hot and ready to add to your cart.`;
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleAddSelectedToCart = async () => {
    if (!selectedRestaurant) return;

    try {
      setIsAddingFromModal(true);
      await addItem({
        name: selectedRestaurant.name,
        qty: 1,
        price: selectedRestaurant.minOrder,
      });
      setSelectedRestaurant(null);
    } finally {
      setIsAddingFromModal(false);
    }
  };

  const foodStory = selectedRestaurant ? getFoodStory(selectedRestaurant) : null;

  return (
    <div className={`page ${styles.home} fade-up`}>
      <div className={styles.statsRow}>
        <StatCard icon="📦" label="Total Orders" value={String(orderStats.orderCount)} sub={orderStats.orderCount > 0 ? "Matches your order history" : "No past orders yet"} />
        <StatCard icon="💰" label="Total Spent" value={`₹${orderStats.totalSpent.toLocaleString("en-IN")}`} sub={orderStats.totalSpent > 0 ? "Matches your order history" : "Start ordering to track spend"} />
        <StatCard icon="⭐" label="Avg Rating" value="4.6" highlight />
        <StatCard icon="🕒" label="Avg Delivery" value="28 min" />
      </div>

      {/* Category Strip */}
      <div className={styles.catSection}>
        <div className={styles.sectionTitle}>Browse by Category</div>
        <div className={styles.catStrip}>
          {categories.map((c, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveCategory(i)}
              className={`${styles.catBtn} ${activeCategory === i ? styles.catActive : ""}`}
              aria-pressed={activeCategory === i}
              aria-label={`Filter by ${c.label}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className={styles.mainGrid}>
        <div className={styles.listingCol}>
          <div className={styles.sectionTitle}>
            {search ? `Results for "${search}"` : "Restaurants Near You"}
            <span className={styles.count}>{filtered.length} found</span>
          </div>

          <div className={styles.restaurantGrid}>
            {isLoading && (
              <div className={styles.noResults}>Loading food items...</div>
            )}

            {!isLoading && error && (
              <div className={styles.noResults}>{error}</div>
            )}

            {filtered.map(r => (
              <RestaurantCard key={r.id} restaurant={r} onClick={() => handleRestaurantClick(r)} />
            ))}

            {!isLoading && !error && filtered.length === 0 && (
              <div className={styles.noResults}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                No restaurants found for "{search}"
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebarCol}>
          <LiveTracker />
          <CartSidebar quickAddItems={filtered.slice(0, 5)} />
        </div>
      </div>

      {selectedRestaurant && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedRestaurant(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setSelectedRestaurant(null)}
              aria-label="Close restaurant details"
            >
              ✕
            </button>

            <div className={styles.modalHero}>
              <div className={styles.modalEmoji}>{selectedRestaurant.img}</div>
              <div className={styles.modalHeroText}>
                <div className={styles.modalTag}>{selectedRestaurant.tag || "Featured Item"}</div>
                <h3 className={styles.modalTitle}>{selectedRestaurant.name}</h3>
                <div className={styles.modalSub}>{selectedRestaurant.cuisine}</div>
              </div>
            </div>

            <div className={styles.modalInfoGrid}>
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Rating</span>
                <span className={styles.modalInfoValue}>⭐ {selectedRestaurant.rating}</span>
              </div>
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Delivery Time</span>
                <span className={styles.modalInfoValue}>🕒 {selectedRestaurant.time} min</span>
              </div>
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Status</span>
                <span className={styles.modalInfoValue}>{selectedRestaurant.open ? "Open now" : "Currently closed"}</span>
              </div>
              <div className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Taste Profile</span>
                <span className={styles.modalInfoValue}>{selectedRestaurant.open ? "Freshly made, served hot" : "Worth waiting for"}</span>
              </div>
            </div>

            <div className={styles.modalStoryGrid}>
              <div className={styles.modalStoryCard}>
                <div className={styles.modalStoryTitle}>Authentic ingredients</div>
                <div className={styles.modalStoryText}>
                  {foodStory.ingredients.join(", ")}.
                </div>
              </div>

              <div className={styles.modalStoryCard}>
                <div className={styles.modalStoryTitle}>Elegant preparation</div>
                <div className={styles.modalStoryText}>
                  {foodStory.process.join(", ")}.
                </div>
              </div>

              <div className={`${styles.modalStoryCard} ${styles.modalStoryWide}`}>
                <div className={styles.modalStoryTitle}>Why it stands out</div>
                <div className={styles.modalStoryText}>
                  {getRestaurantSummary(selectedRestaurant)} {foodStory.note}
                </div>
              </div>

              <div className={`${styles.modalStoryCard} ${styles.modalStoryWide}`}>
                <div className={styles.modalStoryTitle}>Culinary heritage</div>
                <div className={styles.modalStoryText}>
                  {foodStory.heritage}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalSecondaryBtn} onClick={() => setSelectedRestaurant(null)}>
                Not now
              </button>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={handleAddSelectedToCart}
                disabled={isAddingFromModal}
              >
                {isAddingFromModal ? "Adding..." : "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
