#!/usr/bin/env node
/**
 * Generate the ADMIN_PASSWORD_HASH value.
 *
 *   node scripts/hash-password.mjs "your-password"
 *
 * Paste the output into Netlify's environment variables. The plaintext
 * password is never stored anywhere.
 */
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}
if (password.length < 12) {
  console.error("Refusing: use at least 12 characters for an admin password.");
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64);

console.log("\nADMIN_PASSWORD_HASH=" + `scrypt$${salt.toString("hex")}$${key.toString("hex")}`);
console.log("ADMIN_SESSION_SECRET=" + crypto.randomBytes(32).toString("hex"));
console.log("\nSet these (plus ADMIN_USERNAME) in your environment.\n");
