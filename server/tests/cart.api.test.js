import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import { createApp } from "../index.js";
import { User } from "../models/User.js";
import { CartItem } from "../models/CartItem.js";
import { Order } from "../models/Order.js";

let mongoServer;
const app = createApp();

async function signUpAndGetToken(email) {
  const response = await request(app)
    .post("/api/auth/signup")
    .send({
      name: "Test User",
      email,
      phone: "9999999999",
      password: "secret123",
    });

  assert.equal(response.status, 201);
  assert.equal(typeof response.body.token, "string");
  assert.notEqual(response.body.token.length, 0);

  return response.body.token;
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.after(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test.beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    CartItem.deleteMany({}),
    Order.deleteMany({}),
  ]);
});

test("rejects cart access without auth token", async () => {
  const response = await request(app).get("/api/cart");
  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Authentication required");
});

test("adds and retrieves cart items for authenticated user", async () => {
  const token = await signUpAndGetToken("cart-user@example.com");

  const addResponse = await request(app)
    .post("/api/cart/add")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Paneer Wrap", qty: 2, price: 120 });

  assert.equal(addResponse.status, 201);
  assert.equal(addResponse.body.cartItems.length, 1);
  assert.equal(addResponse.body.cartItems[0].name, "Paneer Wrap");
  assert.equal(addResponse.body.cartItems[0].qty, 2);
  assert.equal(addResponse.body.cartItems[0].price, 120);

  const getResponse = await request(app)
    .get("/api/cart")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.cartItems.length, 1);
  assert.equal(getResponse.body.cartItems[0].name, "Paneer Wrap");
});

test("updates and deletes cart item quantity", async () => {
  const token = await signUpAndGetToken("update-user@example.com");

  const addResponse = await request(app)
    .post("/api/cart/add")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Masala Dosa", qty: 1, price: 90 });

  const itemId = addResponse.body.cartItems[0]._id;
  assert.equal(typeof itemId, "string");

  const incrementResponse = await request(app)
    .patch(`/api/cart/${itemId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ delta: 2 });

  assert.equal(incrementResponse.status, 200);
  assert.equal(incrementResponse.body.cartItems[0].qty, 3);

  const removeViaDeltaResponse = await request(app)
    .patch(`/api/cart/${itemId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ delta: -3 });

  assert.equal(removeViaDeltaResponse.status, 200);
  assert.equal(removeViaDeltaResponse.body.cartItems.length, 0);
});

test("keeps cart isolated per user", async () => {
  const tokenA = await signUpAndGetToken("user-a@example.com");
  const tokenB = await signUpAndGetToken("user-b@example.com");

  await request(app)
    .post("/api/cart/add")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ name: "User A Item", qty: 1, price: 50 });

  await request(app)
    .post("/api/cart/add")
    .set("Authorization", `Bearer ${tokenB}`)
    .send({ name: "User B Item", qty: 1, price: 75 });

  const cartA = await request(app)
    .get("/api/cart")
    .set("Authorization", `Bearer ${tokenA}`);

  const cartB = await request(app)
    .get("/api/cart")
    .set("Authorization", `Bearer ${tokenB}`);

  assert.equal(cartA.status, 200);
  assert.equal(cartB.status, 200);
  assert.equal(cartA.body.cartItems.length, 1);
  assert.equal(cartB.body.cartItems.length, 1);
  assert.equal(cartA.body.cartItems[0].name, "User A Item");
  assert.equal(cartB.body.cartItems[0].name, "User B Item");
});
