import styles from "./RestaurantCard.module.css";
import { formatCurrency } from "../utils/currency";

export default function RestaurantCard({ restaurant, onClick }) {
  const r = restaurant;
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.emoji}>{r.img}</div>
        <div className={styles.badges}>
          {r.tag && <span className="badge badge-orange">{r.tag}</span>}
          <span className={`badge ${r.open ? "badge-green" : "badge-muted"}`}>
            <span className={`${styles.dot} ${r.open ? styles.dotGreen : ""} ${r.open ? "pulse" : ""}`} />
            {r.open ? "Open" : "Closed"}
          </span>
        </div>
      </div>
      <div className={styles.name}>{r.name}</div>
      <div className={styles.cuisine}>{r.cuisine}</div>
      <div className={styles.meta}>
        <span>⭐ {r.rating}</span>
        <span>🕒 {r.time} min</span>
        <span>{formatCurrency(r.minOrder)}</span>
      </div>
    </button>
  );
}
