import { auth } from "./config";
import { redirect } from "next/navigation";

export async function requireBusinessOwner() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "BUSINESS_OWNER" &&
    session.user.role !== "BOTH"
  ) {
    redirect("/login");
  }

  if (!session.user.businessId) {
    redirect("/onboarding");
  }

  return {
    session,
    userId: session.user.id,
    businessId: session.user.businessId,
  };
}

export async function requireCustomer() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  if (
    session.user.role !== "CUSTOMER" &&
    session.user.role !== "BOTH"
  ) {
    return null;
  }

  return session;
}

export async function getOptionalSession() {
  return await auth();
}
