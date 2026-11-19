import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_TABLES = [
  'ff_users',
  'ff_quotas',
  'ff_community_posts',
  'ff_community_reports',
  'ff_admin_config',
  'ff_audit_logs',
  'ff_changelog',
  'ff_projects',
];

function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    return;
  }
}

loadLocalEnv();

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !serviceRoleKey) {
  process.stderr.write(
    '[verify-supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env or environment.\n' +
      'Please configure both variables and paste supabase/schema.sql in Supabase Dashboard -> SQL Editor.\n'
  );
  process.exit(1);
}

async function checkTable(table) {
  const endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1000`;
  try {
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return {
        table,
        ok: false,
        count: 0,
        error: `HTTP ${resp.status}: ${errText.slice(0, 180)}`,
      };
    }
    const rows = await resp.json();
    return {
      table,
      ok: true,
      count: Array.isArray(rows) ? rows.length : 0,
      error: null,
    };
  } catch (err) {
    return {
      table,
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

async function main() {
  process.stdout.write(`[verify-supabase] Checking 8 tables at ${supabaseUrl}...\n`);
  const results = await Promise.all(REQUIRED_TABLES.map((t) => checkTable(t)));
  let missingCount = 0;

  for (const res of results) {
    if (res.ok) {
      process.stdout.write(`  [OK] ${res.table}: ${res.count} row(s)\n`);
    } else {
      missingCount += 1;
      process.stderr.write(`  [MISSING/ERROR] ${res.table}: ${res.error}\n`);
    }
  }

  if (missingCount > 0) {
    process.stderr.write(
      `\n[verify-supabase] FAILED: ${missingCount} table(s) missing or inaccessible.\n` +
        'Action required: Open Supabase Dashboard -> SQL Editor, paste the contents of supabase/schema.sql, and click Run.\n'
    );
    process.exit(1);
  }

  process.stdout.write('\n[verify-supabase] All 8 Supabase PostgreSQL tables verified Ready.\n');
}

main();
