// Bộ chạy thử nghiệm: mở nhiều phiên PostgreSQL, in từng câu lệnh và kết quả thật.
// Kết nối mặc định khớp lab/docker-compose.yml (cổng 5433, không phải 5432, để không chạy nhầm vào PostgreSQL có sẵn trên máy);
// đổi bằng biến môi trường PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE.
import pg from 'pg';
import { createRequire } from 'node:module';

const pgVersion = createRequire(import.meta.url)('pg/package.json').version;

export const config = {
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT ?? 5433),
  user: process.env.PGUSER ?? 'lab',
  password: process.env.PGPASSWORD ?? 'lab',
  database: process.env.PGDATABASE ?? 'lab',
};

const t0 = Date.now();
const stamp = () => `${String(Date.now() - t0).padStart(5, ' ')}ms`;

export function step(title) {
  console.log(`\n## ${title}`);
}
export function note(text) {
  console.log(`-- ${text}`);
}

function formatRows(r, name) {
  const n = r.rowCount ?? r.rows?.length ?? 0;
  if (!r.fields?.length) return `   [${name}] → ${r.command}${r.rowCount != null && r.command !== 'BEGIN' && r.command !== 'COMMIT' && r.command !== 'ROLLBACK' && r.command !== 'SET' && r.command !== 'CREATE' && r.command !== 'DROP' ? ' ' + r.rowCount : ''}`;
  const cols = r.fields.map((f) => f.name);
  const rows = r.rows.map((row) => cols.map((c) => (row[c] === null ? 'NULL' : row[c] instanceof Date ? row[c].toISOString() : String(row[c]))));
  const width = cols.map((c, i) => Math.max(c.length, ...rows.map((x) => x[i].length)));
  const line = (vals) => '   ' + vals.map((v, i) => v.padEnd(width[i])).join(' | ');
  return [`   [${name}] →`, line(cols), '   ' + width.map((w) => '-'.repeat(w)).join('-+-'), ...rows.map(line), `   (${n} dòng)`].join('\n');
}

export async function session(name, overrides = {}) {
  const client = new pg.Client({ ...config, ...overrides, application_name: `lab-${name}` });
  client.on('notice', (m) => console.log(`[${name}] ${stamp()}  ${m.severity ?? 'NOTICE'}: ${m.message}${m.detail ? `\n   DETAIL: ${m.detail}` : ''}`));
  await client.connect();
  return {
    name,
    client,
    /** Chạy một câu lệnh, in lệnh và kết quả; lỗi được in ra và trả về thay vì ném. */
    async q(sql, params, { quiet = false } = {}) {
      const shown = sql.replace(/\s+/g, ' ').trim();
      if (!quiet) console.log(`[${name}] ${stamp()}  ${shown}${params ? `   -- tham số: ${JSON.stringify(params)}` : ''}`);
      try {
        const r = await client.query(sql, params);
        if (!quiet) console.log(formatRows(r, name));
        return r;
      } catch (e) {
        console.log(`[${name}] ${stamp()}  LỖI ${e.code}: ${e.message}${e.detail ? `\n   DETAIL: ${e.detail}` : ''}`);
        return { error: e };
      }
    },
    end: () => client.end(),
  };
}

export async function header(title) {
  console.log(`# ${title}`);
  const s = await session('info');
  const v = await s.client.query('select version() as v, current_setting(\'default_transaction_isolation\') as iso');
  console.log(`Máy chủ: ${v.rows[0].v}`);
  console.log(`Isolation mặc định: ${v.rows[0].iso}`);
  console.log(`Client: Node.js ${process.version}, driver pg ${pgVersion}`);
  console.log(`Thời điểm chạy: ${new Date().toISOString()}`);
  await s.end();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
