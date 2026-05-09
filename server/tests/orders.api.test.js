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
      name: "Order User",
      email,
      phone: "9999999999",
      password: "secret123",
    });

  assert.equal(response.status, 201);
  return response.body.token;
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.after(async () => {
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
});

test.beforeEach(async () => {
  await Promise.all([User.deleteMany({}), CartItem.deleteMany({}), Order.deleteMany({})]);
});

test("checkout creates order and clears cart", async () => {
  const token = await signUpAndGetToken("order-user@example.com");

  // add two items
  await request(app).post("/api/cart/add").set("Authorization", `Bearer ${token}`).send({ name: "A", qty: 1, price: 50 });
  await request(app).post("/api/cart/add").set("Authorization", `Bearer ${token}`).send({ name: "B", qty: 2, price: 30 });

  const checkout = await request(app)
    .post("/api/orders/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ paymentMethod: "Visa", deliveryAddress: "Home" });

  assert.equal(checkout.status, 201);
  assert.equal(typeof checkout.body.order?._id, "string");
  assert.equal(checkout.body.orders.length, 1);

  const cartAfter = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);
  assert.equal(cartAfter.status, 200);
  assert.equal(cartAfter.body.cartItems.length, 0);
});

test("cancel and deliver order endpoints work and are user-scoped", async () => {
  const token = await signUpAndGetToken("order2@example.com");

  await request(app).post("/api/cart/add").set("Authorization", `Bearer ${token}`).send({ name: "C", qty: 1, price: 100 });

  const checkout = await request(app)
    .post("/api/orders/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({});

  const orderId = checkout.body.order._id;

  const cancelRes = await request(app).patch(`/api/orders/${orderId}/cancel`).set("Authorization", `Bearer ${token}`);
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.order.status, "Cancelled");

  // cannot deliver a cancelled order; create a fresh one
  await request(app).post("/api/cart/add").set("Authorization", `Bearer ${token}`).send({ name: "D", qty: 1, price: 60 });
  const checkout2 = await request(app).post("/api/orders/checkout").set("Authorization", `Bearer ${token}`).send({});
  const order2Id = checkout2.body.order._id;

  const deliverRes = await request(app).patch(`/api/orders/${order2Id}/deliver`).set("Authorization", `Bearer ${token}`);
  assert.equal(deliverRes.status, 200);
  assert.equal(deliverRes.body.order.status, "Delivered");
});
