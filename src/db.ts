// src/db.ts
import { Pool } from 'pg';

// A connection pool is an efficient way to manage database connections.
export const pool = new Pool({
  user: 'postgres', // This is usually the default user
  host: 'localhost',
  database: 'postgres', // The default database you connected to in pgAdmin
  password: 'eterna', // <-- IMPORTANT: Change this!
  port: 5432,
});