import { type Config } from "drizzle-kit";

import { env } from "admin-panel/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["admin-panel_*"],
} satisfies Config;
