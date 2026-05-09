const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getActiveAuthToken() {
  try {
    const storedUser = localStorage.getItem("bites_basic_user");
    if (!storedUser) return "";

    const parsedUser = JSON.parse(storedUser);
    return typeof parsedUser?.token === "string" ? parsedUser.token.trim() : "";
  } catch {
    return "";
  }
}

async function request(path, options) {
  const headers = { "Content-Type": "application/json" };
  const token = getActiveAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Request failed");
  }

  return response.json();
}

function normalizeDoc(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const { _id, ...rest } = doc;
  return {
    id: _id,
    ...rest
  };
}

export async function getFoodItems(params = {}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("q", params.search);
  }

  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await request(`/food-items${suffix}`);

  return data.foodItems.map(normalizeDoc);
}

export async function getOrders() {
  const data = await request(`/orders`);
  return data.orders.map(normalizeDoc);
}

export async function getCartItems() {
  const data = await request("/cart");
  return data.cartItems.map(normalizeDoc);
}

export async function addCartItem(item) {
  const data = await request("/cart/add", {
    method: "POST",
    body: JSON.stringify(item)
  });

  return data.cartItems.map(normalizeDoc);
}

export async function updateCartItemQty(id, delta) {
  const data = await request(`/cart/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ delta })
  });

  return data.cartItems.map(normalizeDoc);
}

export async function removeCartItemById(id) {
  const data = await request(`/cart/${id}`, {
    method: "DELETE"
  });

  return data.cartItems.map(normalizeDoc);
}

export async function checkoutCart(payload = {}) {
  const data = await request("/orders/checkout", {
    method: "POST",
    body: JSON.stringify({ ...payload })
  });

  return {
    order: normalizeDoc(data.order),
    orders: data.orders.map(normalizeDoc)
  };
}

export async function cancelOrder(orderId) {
  const data = await request(`/orders/${orderId}/cancel`, {
    method: "PATCH"
  });

  return data.orders.map(normalizeDoc);
}

export async function deliverOrder(orderId) {
  const data = await request(`/orders/${orderId}/deliver`, {
    method: "PATCH"
  });

  return data.orders.map(normalizeDoc);
}

export async function signUpUser(payload) {
  const data = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...normalizeDoc(data.user),
    token: data.token || "",
  };
}

export async function loginUser(payload) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...normalizeDoc(data.user),
    token: data.token || "",
  };
}
