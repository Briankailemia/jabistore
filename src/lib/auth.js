import { getServerSession } from "next-auth/next"

import { authOptions as baseAuthOptions } from "@/lib/authOptions"

export const authOptions = baseAuthOptions

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}
