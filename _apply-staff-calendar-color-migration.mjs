import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Adding calendar_color column to staff_member table...");

  await sql`
    ALTER TABLE staff_member
    ADD COLUMN IF NOT EXISTS calendar_color text;
  `;

  console.log("Done! Staff calendar color column added.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
