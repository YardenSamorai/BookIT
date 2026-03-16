import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { businesses } from "@/lib/db/schema";
import { loginSchema } from "@/validators/auth";
import { verifyOtp } from "./otp";

export const providers = [
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !user.passwordHash) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      const business = await db.query.businesses.findFirst({
        where: eq(businesses.ownerId, user.id),
        columns: { id: true },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: business?.id,
      };
    },
  }),

  Credentials({
    id: "phone-otp",
    name: "Phone OTP",
    credentials: {
      phone: { label: "Phone", type: "text" },
      code: { label: "OTP Code", type: "text" },
      name: { label: "Name", type: "text" },
    },
    async authorize(credentials) {
      const phone = credentials?.phone as string | undefined;
      const code = credentials?.code as string | undefined;
      const name = credentials?.name as string | undefined;

      if (!phone || !code) return null;

      const result = await verifyOtp(phone, code);
      if (!result.valid) return null;

      let user = await db.query.users.findFirst({
        where: eq(users.phone, phone),
      });

      if (!user) {
        if (!name) return null;
        const [newUser] = await db
          .insert(users)
          .values({ phone, name, role: "CUSTOMER", phoneVerified: true })
          .returning();
        user = newUser;
      } else {
        // Existing user without a name — require name input
        if (!user.name && !name) return null;

        const updates: Record<string, unknown> = {};
        if (!user.phoneVerified) updates.phoneVerified = true;
        if (!user.name && name) updates.name = name;

        if (Object.keys(updates).length > 0) {
          await db
            .update(users)
            .set(updates)
            .where(eq(users.id, user.id));
          if (updates.name) user = { ...user, name: name! };
        }
      }

      return {
        id: user.id,
        name: user.name,
        role: user.role,
      };
    },
  }),

  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
  }),
];
