import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/models/User.js';

async function main() {
  const argv = process.argv.slice(2);
  const emailArg = argv.find(a => a.startsWith('--email='));
  const passArg = argv.find(a => a.startsWith('--password='));

  if (!emailArg || !passArg) {
    console.error('Usage: node scripts/reset-user-password.js --email=you@domain --password=NewPass123');
    process.exit(2);
  }

  const email = emailArg.split('=')[1].trim().toLowerCase();
  const newPassword = passArg.split('=')[1];

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/bites-app';

  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found:', email);
      process.exit(3);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    console.log('Password updated for', email);
  } catch (err) {
    console.error('Failed to update password:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
