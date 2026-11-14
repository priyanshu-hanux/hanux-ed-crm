/**
 * Grants or revokes Platform Admin (Hanux staff). Deliberately not in the API:
 * only someone with access to the server and its database can run it.
 *
 *   npm run platform:admin -- grant someone@hanux.com "Their Name"
 *   npm run platform:admin -- revoke someone@hanux.com
 *   npm run platform:admin -- list
 */
import { prisma } from "@/lib/prisma.js"
import {
  grantPlatformAdmin,
  revokePlatformAdmin,
} from "@/modules/platform/platform.service.js"

const [command, email, name] = process.argv.slice(2)

async function main() {
  switch (command) {
    case "grant": {
      if (!email) throw new Error("Usage: grant <email> [name]")
      const { created } = await grantPlatformAdmin(email, name)
      console.log(
        created
          ? `Created ${email} as Platform Admin. A link to set their password was emailed (in development it's in the server log above).`
          : `${email} is now a Platform Admin. They'll see "Platform Admin" in the role switcher after signing in again.`
      )
      break
    }
    case "revoke": {
      if (!email) throw new Error("Usage: revoke <email>")
      console.log(
        (await revokePlatformAdmin(email))
          ? `${email} is no longer a Platform Admin.`
          : `${email} wasn't a Platform Admin.`
      )
      break
    }
    case "list": {
      const admins = await prisma.user.findMany({
        where: { isPlatformAdmin: true },
        select: { email: true, name: true, lastLoginAt: true },
        orderBy: { email: "asc" },
      })
      console.table(admins)
      break
    }
    default:
      throw new Error("Commands: grant <email> [name] | revoke <email> | list")
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
