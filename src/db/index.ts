import { drizzle } from 'drizzle-orm/neon-http';
import config from "@/lib/config"
import { neon } from '@neondatabase/serverless';

console.log(config.env.databaseUrl);


const sql = neon(config.env.databaseUrl)

export const db = drizzle({client: sql});
