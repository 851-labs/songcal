import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

const db = drizzle({
  connection: { url: process.env.DATABASE_URL! },
  schema,
});

export { db, schema };
export type Database = typeof db;
