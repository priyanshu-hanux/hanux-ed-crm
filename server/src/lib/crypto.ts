import { createHash, randomBytes } from "node:crypto"

/** A URL-safe random token, e.g. for sessions and invites. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url")
}

/** SHA-256 hex digest. Tokens are stored only as hashes. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}
