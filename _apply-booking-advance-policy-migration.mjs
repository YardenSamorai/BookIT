import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Adding booking advance policy columns to business table...");

  await sql`
    ALTER TABLE business
    ADD COLUMN IF NOT EXISTS min_booking_advance_hours integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS disable_same_day_bookings boolean NOT NULL DEFAULT false;
  `;

  console.log("Done! Booking advance policy columns added.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
