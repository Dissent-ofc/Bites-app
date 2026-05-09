import styles from "./StatCard.module.css";

export default function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <div className={`${styles.value} ${highlight ? styles.highlight : ""}`}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>↑ {sub}</div>}
    </div>
  );
}
