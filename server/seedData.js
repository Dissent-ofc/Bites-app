export const foodItemsSeed = [
  { name: "Spice Garden", cuisine: "Indian", category: "Curry", rating: 4.8, time: "25-35", price: "INR INR", open: true, tag: "Popular", img: "🍛", minOrder: 199 },
  { name: "Sakura Ramen", cuisine: "Japanese", category: "Noodles", rating: 4.6, time: "30-40", price: "INR INR INR", open: true, tag: "Trending", img: "🍜", minOrder: 299 },
  { name: "Burger Barn", cuisine: "American", category: "Burgers", rating: 4.5, time: "20-30", price: "INR", open: false, tag: "Deals", img: "🍔", minOrder: 149 },
  { name: "Green Bowl", cuisine: "Vegan", category: "Salads", rating: 4.7, time: "15-25", price: "INR INR", open: true, tag: "Healthy", img: "🥗", minOrder: 179 },
  { name: "Pizza Primo", cuisine: "Italian", category: "Pizza", rating: 4.4, time: "30-45", price: "INR INR", open: true, tag: "", img: "🍕", minOrder: 249 },
  { name: "Taco Loco", cuisine: "Mexican", category: "All", rating: 4.3, time: "20-30", price: "INR", open: true, tag: "", img: "🌮", minOrder: 129 },
  { name: "Dragon Wok", cuisine: "Chinese", category: "Noodles", rating: 4.5, time: "25-35", price: "INR INR", open: true, tag: "New", img: "🥡", minOrder: 199 },
  { name: "Sweet Tooth", cuisine: "Desserts", category: "Desserts", rating: 4.9, time: "15-20", price: "INR INR", open: true, tag: "Top Rated", img: "🍰", minOrder: 99 },
  { name: "Napoli Stone Oven", cuisine: "Italian", category: "Pizza", rating: 4.7, time: "28-38", price: "INR INR INR", open: true, tag: "Chef Special", img: "🍕", minOrder: 329 },
  { name: "Bombay Biryani Co.", cuisine: "Indian", category: "Curry", rating: 4.8, time: "30-40", price: "INR INR", open: true, tag: "Best Seller", img: "🍲", minOrder: 249 },
  { name: "Urban Patty House", cuisine: "American", category: "Burgers", rating: 4.4, time: "22-32", price: "INR INR", open: true, tag: "Combo", img: "🍔", minOrder: 169 },
  { name: "Kyoto Sushi Lab", cuisine: "Japanese", category: "Sushi", rating: 4.6, time: "35-45", price: "INR INR INR", open: true, tag: "Fresh", img: "🍣", minOrder: 349 },
  { name: "Leaf & Lentil", cuisine: "Mediterranean", category: "Salads", rating: 4.5, time: "18-28", price: "INR INR", open: true, tag: "Protein Rich", img: "🥙", minOrder: 189 },
  { name: "Noodle District", cuisine: "Thai", category: "Noodles", rating: 4.3, time: "24-34", price: "INR INR", open: true, tag: "Spicy", img: "🍜", minOrder: 179 },
  { name: "Cocoa Clouds", cuisine: "Bakery", category: "Desserts", rating: 4.8, time: "16-24", price: "INR INR", open: true, tag: "New", img: "🧁", minOrder: 119 },
  { name: "Fizz Factory", cuisine: "Beverages", category: "Drinks", rating: 4.4, time: "10-18", price: "INR", open: true, tag: "Cold Picks", img: "🥤", minOrder: 89 },
  { name: "Brew Theory", cuisine: "Beverages", category: "Drinks", rating: 4.7, time: "12-20", price: "INR", open: true, tag: "Iced Coffees", img: "🧋", minOrder: 99 },
  { name: "Citrus Press", cuisine: "Juices", category: "Drinks", rating: 4.6, time: "10-16", price: "INR", open: true, tag: "Fresh Squeezed", img: "🍹", minOrder: 95 },
  { name: "Shake Studio", cuisine: "Beverages", category: "Drinks", rating: 4.5, time: "12-22", price: "INR INR", open: true, tag: "Thick Shakes", img: "🥛", minOrder: 119 },
  { name: "Smoky Seoul Bowl", cuisine: "Korean", category: "Noodles", rating: 4.7, time: "22-32", price: "INR INR", open: true, tag: "Chef Pick", img: "🍜", minOrder: 209 },
  { name: "The Kebab Room", cuisine: "Middle Eastern", category: "Curry", rating: 4.6, time: "26-36", price: "INR INR", open: true, tag: "Grill House", img: "🍢", minOrder: 219 },
  { name: "Momo Mile", cuisine: "Tibetan", category: "Noodles", rating: 4.5, time: "20-30", price: "INR", open: true, tag: "Steamed", img: "🥟", minOrder: 139 },
  { name: "Chaat Junction", cuisine: "Indian", category: "All", rating: 4.2, time: "15-25", price: "INR", open: true, tag: "Street Style", img: "🍽️", minOrder: 109 },
  { name: "Gelato Garage", cuisine: "Italian", category: "Desserts", rating: 4.7, time: "14-22", price: "INR INR", open: true, tag: "Summer Pick", img: "🍨", minOrder: 129 }
];

export const cartItemsSeed = [
  { name: "Butter Chicken", qty: 1, price: 320 },
  { name: "Garlic Naan", qty: 2, price: 60 },
  { name: "Mango Lassi", qty: 1, price: 80 }
];

export const ordersSeed = [
  { orderCode: "#2041", restaurant: "Spice Garden", items: "Butter Chicken, Naan x2", total: 540, status: "Delivered", time: "2h ago", img: "🍛" },
  { orderCode: "#2038", restaurant: "Sakura Ramen", items: "Tonkotsu Ramen, Gyoza", total: 720, status: "Delivered", time: "Yesterday", img: "🍜" },
  { orderCode: "#2035", restaurant: "Green Bowl", items: "Buddha Bowl, Smoothie", total: 420, status: "Delivered", time: "2 days ago", img: "🥗" },
  { orderCode: "#2031", restaurant: "Pizza Primo", items: "Margherita x2, Garlic Bread", total: 680, status: "Delivered", time: "4 days ago", img: "🍕" }
];
