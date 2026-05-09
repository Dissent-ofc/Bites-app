import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../server/models/User.js';

function getArg(name) {
  const match = process.argv.slice(2).find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : '';
}

async function main() {
  const email = getArg('email').trim().toLowerCase();
  const name = getArg('name').trim().toLowerCase();

  if (!email) {
    console.error('Usage: node scripts/link-orders-to-user.js --email=aditya@gmail.com [--name="aditya kumar"]');
    process.exit(2);
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/bites-app';
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exit(3);
    }

    if (name && String(user.name || '').trim().toLowerCase() !== name) {
      console.error(`User name mismatch. Found '${user.name}', expected '${name}'.`);
      process.exit(4);
    }

    // Use native collection update so we can persist userId even if schema omits it.
    const result = await mongoose.connection.collection('orders').updateMany(
      { userEmail: email },
      {
        $set: {
          userId: user._id,
          userEmail: email,
        },
      }
    );

    console.log(`Linked ${result.modifiedCount} order(s) to userId ${user._id} for ${email}`);
  } catch (error) {
    console.error('Failed to link orders to user:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
