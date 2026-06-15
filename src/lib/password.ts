import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

// Generates a readable temp password, e.g. "NSR-7f3a9c21"
export function generateTempPassword() {
  return `NSR-${randomBytes(4).toString("hex")}`
}
