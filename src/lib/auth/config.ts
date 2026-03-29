import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, users } from "@/lib/db/schema";
import { providers } from "./providers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, profile.email),
          columns: { id: true, role: true, name: true, avatarUrl: true },
        });

        if (existing) {
          user.id = existing.id;
          user.role = existing.role;

          const updates: Record<string, unknown> = {};
          if (!existing.avatarUrl && (profile as { picture?: string }).picture) {
            updates.avatarUrl = (profile as { picture?: string }).picture;
          }
          if (Object.keys(updates).length > 0) {
            await db.update(users).set(updates).where(eq(users.id, existing.id));
          }
        } else {
          const [newUser] = await db
            .insert(users)
            .values({
              email: profile.email,
              name: profile.name || profile.email.split("@")[0],
              avatarUrl: (profile as { picture?: string }).picture || null,
              role: "BUSINESS_OWNER",
              emailVerified: true,
            })
            .returning({ id: users.id, role: users.role });
          user.id = newUser.id;
          user.role = newUser.role;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.businessId = user.businessId;
      }

      if (trigger === "signIn" || (token.role === "BUSINESS_OWNER" && !token.businessId)) {
        const business = await db.query.businesses.findFirst({
          where: eq(businesses.ownerId, token.id as string),
          columns: { id: true },
        });
        if (business) {
          token.businessId = business.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string | undefined;
      }
      return session;
    },
  },
});
