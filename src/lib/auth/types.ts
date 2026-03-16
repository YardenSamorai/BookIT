import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    businessId?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      role: string;
      businessId?: string;
    };
  }

  interface JWT {
    id: string;
    role: string;
    businessId?: string;
  }
}
