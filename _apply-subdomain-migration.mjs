import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Adding subdomain columns to business table...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE subdomain_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    ALTER TABLE business
    ADD COLUMN IF NOT EXISTS custom_subdomain TEXT,
    ADD COLUMN IF NOT EXISTS subdomain_status subdomain_status;
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS business_subdomain_idx
    ON business(custom_subdomain)
    WHERE custom_subdomain IS NOT NULL;
  `;

  console.log("Done! Subdomain columns added.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
