import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
    );
  `);
}

export async function runMigrationsUp(): Promise<void> {
  await ensureMigrationsTable();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.up.sql'))
    .sort();

  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY id ASC',
  );
  const executedSet = new Set(rows.map((r) => r.name));

  for (const file of files) {
    const migrationName = file.replace('.up.sql', '');
    if (!executedSet.has(migrationName)) {
      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          migrationName,
        ]);
        await client.query('COMMIT');
        console.log(`✓ Migration applied: ${migrationName}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ Error applying migration ${file}:`, err);
        throw err;
      } finally {
        client.release();
      }
    } else {
      console.log(`- Migration already applied: ${migrationName}`);
    }
  }
}

export async function runMigrationsDown(): Promise<void> {
  await ensureMigrationsTable();

  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY id DESC LIMIT 1',
  );

  const lastMigration = rows[0]?.name;
  if (!lastMigration) {
    console.log('No migrations to roll back.');
    return;
  }

  const downFile = `${lastMigration}.down.sql`;
  const downFilePath = path.join(migrationsDir, downFile);

  if (!fs.existsSync(downFilePath)) {
    throw new Error(`Rollback file not found: ${downFile}`);
  }

  console.log(`Rolling back migration: ${downFile}...`);
  const sql = fs.readFileSync(downFilePath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [
      lastMigration,
    ]);
    await client.query('COMMIT');
    console.log(`✓ Rollback complete for: ${lastMigration}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✗ Error rolling back migration ${downFile}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const direction = process.argv[2] ?? 'up';
  try {
    if (direction === 'down') {
      await runMigrationsDown();
    } else {
      await runMigrationsUp();
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  void main();
}
