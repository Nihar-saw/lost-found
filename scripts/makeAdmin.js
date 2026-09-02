/**
 * Run this script once to promote a user to admin:
 *   node scripts/makeAdmin.js your-email@example.com
 */
import mongoose from "mongoose";
import User from "../src/models/User.js";
import * as dotenv from "dotenv";
dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOneAndUpdate(
  { email },
  { role: "admin" },
  { new: true }
).select("-password");

if (!user) {
  console.error(`No user found with email: ${email}`);
} else {
  console.log(`✅  ${user.name} (${user.email}) is now an ADMIN.`);
}

await mongoose.disconnect();
