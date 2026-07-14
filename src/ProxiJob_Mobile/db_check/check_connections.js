const { Client } = require('pg');
const connectionString = 'postgres://postgres.jjruquhoqcwcmogpfvhf:ProxiJob%4012346@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Database.');

    const res = await client.query(`
      SELECT pid, usename, client_addr, backend_start, query, state 
      FROM pg_stat_activity 
      WHERE datname = 'postgres';
    `);

    console.log('Active Connections:');
    console.table(res.rows.map(r => ({
      pid: r.pid,
      user: r.usename,
      addr: r.client_addr,
      start: r.backend_start,
      state: r.state,
      query: r.query.substring(0, 50)
    })));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
