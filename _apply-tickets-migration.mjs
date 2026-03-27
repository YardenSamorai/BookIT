import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Creating ticket enums and table...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS support_ticket (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status ticket_status NOT NULL DEFAULT 'OPEN',
      priority ticket_priority NOT NULL DEFAULT 'MEDIUM',
      admin_notes TEXT,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS ticket_business_idx ON support_ticket(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ticket_status_idx ON support_ticket(status)`;

  console.log("Done! support_ticket table created.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
