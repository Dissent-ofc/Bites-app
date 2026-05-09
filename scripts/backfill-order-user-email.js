import 'dotenv/config';
import mongoose from 'mongoose';
import { Order } from '../server/models/Order.js';
import { User } from '../server/models/User.js';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/bites-app';

  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });

  try {
    const orders = await Order.find({
      $or: [{ userEmail: { $exists: false } }, { userEmail: '' }, { userEmail: null }]
    }).lean();

    if (orders.length === 0) {
      console.log('No orders need backfilling.');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const order of orders) {
      if (!order.userId) {
        skipped += 1;
        continue;
      }

      const user = await User.findById(order.userId).lean();
      if (!user?.email) {
        skipped += 1;
        continue;
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            userEmail: String(user.email).trim().toLowerCase()
          }
        }
      );

      updated += 1;
    }

    console.log(`Backfill complete. Updated ${updated} order(s); skipped ${skipped}.`);
  } catch (error) {
    console.error('Failed to backfill order userEmail fields:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
