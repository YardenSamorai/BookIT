import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Adding subdomain history columns...");

  await sql`
    ALTER TABLE business
    ADD COLUMN IF NOT EXISTS subdomain_reject_reason TEXT,
    ADD COLUMN IF NOT EXISTS subdomain_requested_at TIMESTAMPTZ;
  `;

  console.log("Done!");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
