import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

export async function getProducts(businessId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.businessId, businessId))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
}

export async function getProductById(productId: string, businessId: string) {
  return db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.businessId, businessId)),
  });
}
