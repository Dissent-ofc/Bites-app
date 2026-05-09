export const restaurants = [
  { id: 1, name: "Spice Garden", cuisine: "Indian", rating: 4.8, time: "25–35", price: "₹₹", open: true, tag: "Popular", img: "🍛", minOrder: 199 },
  { id: 2, name: "Sakura Ramen", cuisine: "Japanese", rating: 4.6, time: "30–40", price: "₹₹₹", open: true, tag: "Trending", img: "🍜", minOrder: 299 },
  { id: 3, name: "Burger Barn", cuisine: "American", rating: 4.5, time: "20–30", price: "₹", open: false, tag: "Deals", img: "🍔", minOrder: 149 },
  { id: 4, name: "Green Bowl", cuisine: "Vegan", rating: 4.7, time: "15–25", price: "₹₹", open: true, tag: "Healthy", img: "🥗", minOrder: 179 },
  { id: 5, name: "Pizza Primo", cuisine: "Italian", rating: 4.4, time: "30–45", price: "₹₹", open: true, tag: "", img: "🍕", minOrder: 249 },
  { id: 6, name: "Taco Loco", cuisine: "Mexican", rating: 4.3, time: "20–30", price: "₹", open: true, tag: "", img: "🌮", minOrder: 129 },
  { id: 7, name: "Dragon Wok", cuisine: "Chinese", rating: 4.5, time: "25–35", price: "₹₹", open: true, tag: "New", img: "🥡", minOrder: 199 },
  { id: 8, name: "Sweet Tooth", cuisine: "Desserts", rating: 4.9, time: "15–20", price: "₹₹", open: true, tag: "Top Rated", img: "🍰", minOrder: 99 },
];

export const categories = [
  { label: "All", icon: "⚡" },
  { label: "Pizza", icon: "🍕" },
  { label: "Burgers", icon: "🍔" },
  { label: "Noodles", icon: "🍜" },
  { label: "Curry", icon: "🍛" },
  { label: "Salads", icon: "🥗" },
  { label: "Sushi", icon: "🍣" },
  { label: "Desserts", icon: "🍰" },
  { label: "Drinks", icon: "🥤" },
];

export const orderHistory = [
  { id: "#2041", restaurant: "Spice Garden", items: "Butter Chicken, Naan ×2", total: "₹540", status: "Delivered", time: "2h ago", img: "🍛" },
  { id: "#2038", restaurant: "Sakura Ramen", items: "Tonkotsu Ramen, Gyoza", total: "₹720", status: "Delivered", time: "Yesterday", img: "🍜" },
  { id: "#2035", restaurant: "Green Bowl", items: "Buddha Bowl, Smoothie", total: "₹420", status: "Delivered", time: "2 days ago", img: "🥗" },
  { id: "#2031", restaurant: "Pizza Primo", items: "Margherita ×2, Garlic Bread", total: "₹680", status: "Delivered", time: "4 days ago", img: "🍕" },
];

export const notifications = [
  { id: 1, text: "Your order is out for delivery!", time: "2 min ago", read: false, icon: "🛵" },
  { id: 2, text: "20% off on your next order", time: "1h ago", read: false, icon: "🎉" },
  { id: 3, text: "Rahul just left Spice Garden", time: "5 min ago", read: false, icon: "📍" },
  { id: 4, text: "Rate your last order from Sakura Ramen", time: "Yesterday", read: true, icon: "⭐" },
];

export const initialCartItems = [
  { id: 1, name: "Butter Chicken", qty: 1, price: 320 },
  { id: 2, name: "Garlic Naan", qty: 2, price: 60 },
  { id: 3, name: "Mango Lassi", qty: 1, price: 80 },
];

export const liveOrder = {
  id: "#2042",
  restaurant: "Spice Garden",
  items: "Paneer Tikka, Dal Makhani",
  driver: "Rahul",
  eta: "8 min",
  steps: [
    { label: "Order placed", done: true },
    { label: "Preparing your food", done: true },
    { label: "Out for delivery", done: true, active: true },
    { label: "Delivered", done: false },
  ],
};
