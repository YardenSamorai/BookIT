import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.businessId = user.businessId;
      }

      if (token.role !== "SUPER_ADMIN" && token.role === "BUSINESS_OWNER" && !token.businessId) {
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
