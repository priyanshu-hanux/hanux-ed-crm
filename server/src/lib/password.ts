import { hash, verify } from "@node-rs/argon2"

// argon2id with the OWASP-recommended baseline (19 MiB, 2 iterations).
const options = { memoryCost: 19_456, timeCost: 2, parallelism: 1 }

export function hashPassword(password: string): Promise<string> {
  return hash(password, options)
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}

let dummyHash: Promise<string> | undefined

/**
 * Spend the same time as a real check when the email doesn't exist, so
 * response times don't reveal which emails have accounts.
 */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword("dummy-password-for-timing")
  await verifyPassword(await dummyHash, password)
}
